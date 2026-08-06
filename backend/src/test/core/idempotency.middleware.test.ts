// ─────────────────────────────────────────────────────────────────────────────
// Tests unitaires du middleware générique d'idempotence
// (core/middlewares/idempotency.middleware.ts). Monté sur une app Express
// minimale (pas app.ts complet — pas besoin d'auth/session ici) avec un
// handler contrôlé par le test pour simuler succès / erreur métier / panne
// serveur, et prisma mocké pour observer/piloter le cycle de vie du claim.
// ─────────────────────────────────────────────────────────────────────────────

import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../core/config/prisma");
jest.mock("../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { prisma } from "../../core/config/prisma";
import { idempotency } from "../../core/middlewares/idempotency.middleware";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

function buildApp(handler: (req: Request, res: Response) => void) {
  const app = express();
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    // Simule req.user posé par le middleware auth réel, pour vérifier le scoping par org.
    const org = req.headers["x-test-org"];
    if (typeof org === "string") req.user = { userId: "u1", role: "ADMIN", organizationId: org } as never;
    next();
  });
  app.post("/widgets", idempotency(), handler);
  return app;
}

beforeEach(() => {
  mockReset(prismaMock);
});

describe("idempotency() middleware", () => {
  it("sans header Idempotency-Key : passe intégralement, aucun appel prisma", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(201).json({ id: "w1" }));
    const app = buildApp(handler);

    const res = await request(app).post("/widgets").send({ name: "x" });

    expect(res.status).toBe(201);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(prismaMock.idempotencyRecord.create).not.toHaveBeenCalled();
  });

  it("premier appel avec une clé : claim, exécute le handler, met le résultat en cache (DONE)", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(201).json({ id: "w1" }));
    const app = buildApp(handler);
    prismaMock.idempotencyRecord.create.mockResolvedValueOnce({ id: "claim-1" } as never);
    prismaMock.idempotencyRecord.update.mockResolvedValueOnce({} as never);

    const res = await request(app)
      .post("/widgets")
      .set("Idempotency-Key", "key-1")
      .set("x-test-org", "org-1")
      .send({ name: "x" });

    expect(res.status).toBe(201);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(prismaMock.idempotencyRecord.create).toHaveBeenCalledWith({
      data: { key: "key-1", route: "POST:/widgets", organizationId: "org-1", status: "PENDING" },
    });
    // Laisse le temps au handler `res.on("finish")` (asynchrone) de s'exécuter.
    await new Promise((r) => setImmediate(r));
    expect(prismaMock.idempotencyRecord.update).toHaveBeenCalledWith({
      where: { id: "claim-1" },
      data: { status: "DONE", responseStatus: 201, responseBody: { id: "w1" } },
    });
  });

  it("retry avec la même clé déjà DONE : rejoue la réponse en cache, ne ré-exécute pas le handler", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(201).json({ id: "w1" }));
    const app = buildApp(handler);
    prismaMock.idempotencyRecord.create.mockRejectedValueOnce({ code: "P2002" } as never);
    prismaMock.idempotencyRecord.findUnique.mockResolvedValueOnce({
      id: "claim-1",
      status: "DONE",
      responseStatus: 201,
      responseBody: { id: "w1" },
      createdAt: new Date(),
    } as never);

    const res = await request(app).post("/widgets").set("Idempotency-Key", "key-1").send({ name: "x" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "w1" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("requête concurrente réellement en cours (PENDING récent) : 409, pas de rejeu", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(201).json({ id: "w1" }));
    const app = buildApp(handler);
    prismaMock.idempotencyRecord.create.mockRejectedValueOnce({ code: "P2002" } as never);
    prismaMock.idempotencyRecord.findUnique.mockResolvedValueOnce({
      id: "claim-1",
      status: "PENDING",
      responseStatus: null,
      responseBody: null,
      createdAt: new Date(), // récente → dans la fenêtre TTL, pas orpheline
    } as never);

    const res = await request(app).post("/widgets").set("Idempotency-Key", "key-1").send({ name: "x" });

    expect(res.status).toBe(409);
    expect(handler).not.toHaveBeenCalled();
  });

  it("échec serveur (5xx) : libère la clé pour permettre un retry propre", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(500).json({ message: "boom" }));
    const app = buildApp(handler);
    prismaMock.idempotencyRecord.create.mockResolvedValueOnce({ id: "claim-1" } as never);
    prismaMock.idempotencyRecord.delete.mockResolvedValueOnce({} as never);

    const res = await request(app).post("/widgets").set("Idempotency-Key", "key-1").send({ name: "x" });

    expect(res.status).toBe(500);
    await new Promise((r) => setImmediate(r));
    expect(prismaMock.idempotencyRecord.delete).toHaveBeenCalledWith({ where: { id: "claim-1" } });
    expect(prismaMock.idempotencyRecord.update).not.toHaveBeenCalled();
  });
});
