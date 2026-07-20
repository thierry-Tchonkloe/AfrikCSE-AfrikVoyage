// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/integrations (src/modules/integrations).
// Style "code fixe manuel" : getById → toujours 404, create/update/delete/
// testConnection/sync → toujours 400 sur erreur. getAll/getSyncLogs n'ont
// aucun try/catch → errorMiddleware global.
// Une seule config RBAC (SUPER_ADMIN, ADMIN) → 401/403 testés une fois.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/integrations/application/api-integration.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { ApiIntegrationService } from "../../../modules/integrations/application/api-integration.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getByOrganizationMock = ApiIntegrationService.prototype.getByOrganization as jest.Mock;
const getByIdMock = ApiIntegrationService.prototype.getById as jest.Mock;
const createMock = ApiIntegrationService.prototype.create as jest.Mock;
const updateMock = ApiIntegrationService.prototype.update as jest.Mock;
const deleteMock = ApiIntegrationService.prototype.delete as jest.Mock;
const getSyncLogsMock = ApiIntegrationService.prototype.getSyncLogs as jest.Mock;
const testConnectionMock = ApiIntegrationService.prototype.testConnection as jest.Mock;
const syncMock = ApiIntegrationService.prototype.sync as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

const validIntegrationBody = { name: "CRM externe", type: "CRM" };

describe("GET /api/integrations", () => {
  it("200 — retourne les intégrations de l'organisation", async () => {
    const cookie = withSession();
    getByOrganizationMock.mockResolvedValueOnce([{ id: "int-1", name: "CRM externe" }]);

    const res = await request(app).get("/api/integrations").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "int-1", name: "CRM externe" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/integrations");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/integrations").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getByOrganizationMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getByOrganizationMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/integrations").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/integrations/:id", () => {
  it("200 — retourne le détail d'une intégration", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "int-1", name: "CRM externe" });

    const res = await request(app).get("/api/integrations/int-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "int-1", name: "CRM externe" });
  });

  it("404 — intégration introuvable (catch manuel, toujours 404)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Intégration introuvable"));

    const res = await request(app).get("/api/integrations/int-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Intégration introuvable" });
  });
});

describe("POST /api/integrations", () => {
  it("201 — crée une intégration", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "int-1", ...validIntegrationBody });

    const res = await request(app).post("/api/integrations").set("Cookie", cookie).send(validIntegrationBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "int-1", ...validIntegrationBody });
  });

  it("400 — rejette un corps invalide (URL de webhook mal formée)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/integrations")
      .set("Cookie", cookie)
      .send({ ...validIntegrationBody, webhookUrl: "pas-une-url" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.webhookUrl).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du service", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Une intégration de ce type existe déjà"));

    const res = await request(app).post("/api/integrations").set("Cookie", cookie).send(validIntegrationBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Une intégration de ce type existe déjà" });
  });
});

describe("PATCH /api/integrations/:id", () => {
  it("200 — met à jour une intégration", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "int-1", isActive: false });

    const res = await request(app).patch("/api/integrations/int-1").set("Cookie", cookie).send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "int-1", isActive: false });
  });

  it("400 — rejette un corps invalide (nom vide)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/integrations/int-1").set("Cookie", cookie).send({ name: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.name).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du service", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new Error("Intégration introuvable"));

    const res = await request(app).patch("/api/integrations/int-inconnue").set("Cookie", cookie).send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Intégration introuvable" });
  });
});

describe("DELETE /api/integrations/:id", () => {
  it("200 — supprime une intégration", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/integrations/int-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Intégration supprimée" });
  });

  it("400 — propage une erreur métier du service", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new Error("Intégration introuvable"));

    const res = await request(app).delete("/api/integrations/int-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Intégration introuvable" });
  });
});

describe("GET /api/integrations/:id/logs", () => {
  it("200 — retourne l'historique de synchronisation", async () => {
    const cookie = withSession();
    getSyncLogsMock.mockResolvedValueOnce([{ id: "log-1", status: "SUCCESS" }]);

    const res = await request(app).get("/api/integrations/int-1/logs").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "log-1", status: "SUCCESS" }]);
  });
});

describe("POST /api/integrations/:id/test", () => {
  it("200 — teste la connexion à l'intégration", async () => {
    const cookie = withSession();
    testConnectionMock.mockResolvedValueOnce({ success: true, latencyMs: 120 });

    const res = await request(app).post("/api/integrations/int-1/test").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, latencyMs: 120 });
  });

  it("400 — propage une erreur métier (connexion échouée)", async () => {
    const cookie = withSession();
    testConnectionMock.mockRejectedValueOnce(new Error("Connexion refusée par le serveur distant"));

    const res = await request(app).post("/api/integrations/int-1/test").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Connexion refusée par le serveur distant" });
  });
});

describe("POST /api/integrations/:id/sync", () => {
  it("200 — déclenche une synchronisation manuelle", async () => {
    const cookie = withSession();
    syncMock.mockResolvedValueOnce({ id: "log-1", status: "SUCCESS" });

    const res = await request(app).post("/api/integrations/int-1/sync").set("Cookie", cookie).send({ type: "MANUAL" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "log-1", status: "SUCCESS" });
  });

  it("400 — rejette un type de synchronisation invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/integrations/int-1/sync").set("Cookie", cookie).send({ type: "SCHEDULED" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.type).toBeDefined();
    expect(syncMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (intégration désactivée)", async () => {
    const cookie = withSession();
    syncMock.mockRejectedValueOnce(new Error("Intégration désactivée"));

    const res = await request(app).post("/api/integrations/int-1/sync").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Intégration désactivée" });
  });
});
