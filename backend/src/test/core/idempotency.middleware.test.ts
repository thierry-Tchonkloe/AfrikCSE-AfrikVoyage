// Tests unitaires du middleware d'idempotence (core/middlewares/idempotency.middleware.ts).
// Monté sur une app Express minimale (pas besoin d'auth/session ici), avec un
// handler contrôlé par le test pour simuler succès / erreur métier / panne
// serveur, et Prisma mocké pour observer/piloter le cycle de vie du claim.

import express, { Request, Response, NextFunction } from "express";
import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../core/config/prisma");
jest.mock("../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { prisma } from "../../core/config/prisma";
import { idempotency, hashRequest } from "../../core/middlewares/idempotency.middleware";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const KEY = "11111111-1111-4111-8111-111111111111";

// Même hash que celui que produira le middleware pour une requête POST sans
// query et avec ce corps — sert à simuler une clé déjà vue avec le même payload.
const hashOf = (body: unknown) => hashRequest({ method: "POST", query: {}, body } as unknown as Request);

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
    prismaMock.idempotencyRecord.updateMany.mockResolvedValueOnce({ count: 1 } as never);

    const res = await request(app)
      .post("/widgets")
      .set("Idempotency-Key", KEY)
      .set("x-test-org", "org-1")
      .send({ name: "x" });

    expect(res.status).toBe(201);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(prismaMock.idempotencyRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        key: KEY,
        route: "POST:/widgets",
        organizationId: "org-1",
        status: "PENDING",
      }),
    });
    // Laisse le temps au handler `res.on("finish")` (asynchrone) de s'exécuter.
    await new Promise((r) => setImmediate(r));
    // `res.json()` sérialise en interne avant d'appeler `res.send()` : le
    // middleware voit donc une chaîne, pas l'objet — encodage "text", pas "json".
    expect(prismaMock.idempotencyRecord.updateMany).toHaveBeenCalledWith({
      where: { id: "claim-1", lease: expect.any(String), status: "PENDING" },
      data: expect.objectContaining({
        status: "DONE",
        responseStatus: 201,
        responseEncoding: "text",
        responseText: JSON.stringify({ id: "w1" }),
      }),
    });
  });

  it("retry avec la même clé déjà DONE : rejoue la réponse en cache, ne ré-exécute pas le handler", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(201).json({ id: "w1" }));
    const app = buildApp(handler);
    prismaMock.idempotencyRecord.create.mockRejectedValueOnce({ code: "P2002" } as never);
    prismaMock.idempotencyRecord.findUnique.mockResolvedValueOnce({
      id: "claim-1",
      status: "DONE",
      requestHash: hashOf({ name: "x" }),
      responseStatus: 201,
      responseEncoding: "text",
      responseText: JSON.stringify({ id: "w1" }),
      responseContentType: "application/json; charset=utf-8",
      expiresAt: new Date(Date.now() + 60_000), // pas encore expirée → rejouable
    } as never);

    const res = await request(app).post("/widgets").set("Idempotency-Key", KEY).send({ name: "x" });

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
      requestHash: hashOf({ name: "x" }),
      leaseExpiresAt: new Date(Date.now() + 60_000), // encore dans la fenêtre du lease, pas orpheline
    } as never);

    const res = await request(app).post("/widgets").set("Idempotency-Key", KEY).send({ name: "x" });

    expect(res.status).toBe(409);
    expect(handler).not.toHaveBeenCalled();
  });

  it("échec serveur (5xx) : libère la clé pour permettre un retry propre", async () => {
    const handler = jest.fn((_req: Request, res: Response) => res.status(500).json({ message: "boom" }));
    const app = buildApp(handler);
    prismaMock.idempotencyRecord.create.mockResolvedValueOnce({ id: "claim-1" } as never);
    prismaMock.idempotencyRecord.deleteMany.mockResolvedValueOnce({ count: 1 } as never);

    const res = await request(app).post("/widgets").set("Idempotency-Key", KEY).send({ name: "x" });

    expect(res.status).toBe(500);
    await new Promise((r) => setImmediate(r));
    expect(prismaMock.idempotencyRecord.deleteMany).toHaveBeenCalledWith({
      where: { id: "claim-1", lease: expect.any(String) },
    });
    expect(prismaMock.idempotencyRecord.updateMany).not.toHaveBeenCalled();
  });
});
