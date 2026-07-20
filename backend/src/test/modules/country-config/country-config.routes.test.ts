// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/countries (src/modules/country-config).
// Contrôleur ET service fonctionnels (pas de classe) — même pattern de mock
// que flights/hotels/trains/car-rentals (voir flights.routes.test.ts).
// Style `next(err)` + errorMiddleware global partout.
// RBAC : authenticate seul pour GET (tout rôle) ; authorize(SUPER_ADMIN) pour
// PUT/DELETE.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/country-config/application/country-config.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import * as countryConfigService from "../../../modules/country-config/application/country-config.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listMock = countryConfigService.list as jest.Mock;
const findByCodeMock = countryConfigService.findByCode as jest.Mock;
const upsertMock = countryConfigService.upsert as jest.Mock;
const removeMock = countryConfigService.remove as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "EMPLOYE", ...overrides });
}

describe("GET /api/countries", () => {
  it("200 — retourne la liste des configurations pays (tout utilisateur authentifié)", async () => {
    const cookie = withSession();
    listMock.mockResolvedValueOnce([{ code: "BJ", name: "Bénin" }]);

    const res = await request(app).get("/api/countries").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: "BJ", name: "Bénin" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/countries");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/countries").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/countries/:code", () => {
  it("200 — retourne la configuration d'un pays", async () => {
    const cookie = withSession();
    findByCodeMock.mockResolvedValueOnce({ code: "BJ", name: "Bénin" });

    const res = await request(app).get("/api/countries/BJ").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: "BJ", name: "Bénin" });
  });

  it("404 — configuration pays introuvable", async () => {
    const cookie = withSession();
    findByCodeMock.mockRejectedValueOnce(new AppError("Configuration pays introuvable", 404));

    const res = await request(app).get("/api/countries/XX").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Configuration pays introuvable" });
  });
});

describe("PUT /api/countries/:code", () => {
  it("200 — un SUPER_ADMIN crée ou met à jour une configuration pays", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    upsertMock.mockResolvedValueOnce({ code: "BJ", name: "Bénin", currency: "XOF" });

    const res = await request(app).put("/api/countries/BJ").set("Cookie", cookie).send({ name: "Bénin", currency: "XOF" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: "BJ", name: "Bénin", currency: "XOF" });
    expect(upsertMock).toHaveBeenCalledWith(expect.objectContaining({ code: "BJ", name: "Bénin" }));
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).put("/api/countries/BJ").send({ name: "Bénin" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).put("/api/countries/BJ").set("Cookie", cookie).send({ name: "Bénin" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur métier inattendue au middleware d'erreurs global", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    upsertMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).put("/api/countries/BJ").set("Cookie", cookie).send({ name: "Bénin" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("DELETE /api/countries/:code", () => {
  it("204 — un SUPER_ADMIN supprime une configuration pays", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    removeMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/countries/BJ").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });

  it("404 — configuration pays introuvable", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    removeMock.mockRejectedValueOnce(new AppError("Configuration pays introuvable", 404));

    const res = await request(app).delete("/api/countries/XX").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Configuration pays introuvable" });
  });
});
