// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/subsidy-rules (src/modules/subsidy-rules).
//
// Pas de couche service : le contrôleur appelle `SubsidyRulesRepository`
// directement (mocké). Style "code fixe manuel" (comme organization/user/
// settings) — mais avec des vérifications directes item-null → 404 EN PLUS
// du catch générique 500/400 selon la méthode.
// Une seule config RBAC (authorize(ADMIN, SUPER_ADMIN)) → 401/403 testés une
// fois, sur GET /.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/subsidy-rules/infrastructure/subsidy-rules.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { SubsidyRulesRepository } from "../../../modules/subsidy-rules/infrastructure/subsidy-rules.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const findAllMock = SubsidyRulesRepository.prototype.findAll as jest.Mock;
const findByIdMock = SubsidyRulesRepository.prototype.findById as jest.Mock;
const createMock = SubsidyRulesRepository.prototype.create as jest.Mock;
const updateMock = SubsidyRulesRepository.prototype.update as jest.Mock;
const deleteMock = SubsidyRulesRepository.prototype.delete as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

const validRuleBody = { label: "Sport & Bien-être", subsidyPct: 20 };

describe("GET /api/subsidy-rules", () => {
  it("200 — retourne les règles de subvention de l'organisation", async () => {
    const cookie = withSession();
    findAllMock.mockResolvedValueOnce([{ id: "rule-1", label: "Sport & Bien-être" }]);

    const res = await request(app).get("/api/subsidy-rules").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "rule-1", label: "Sport & Bien-être" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/subsidy-rules");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/subsidy-rules").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(findAllMock).not.toHaveBeenCalled();
  });

  it("500 — catch manuel : erreur renvoyée en {message}, pas errorMiddleware", async () => {
    const cookie = withSession();
    findAllMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/subsidy-rules").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

describe("GET /api/subsidy-rules/:id", () => {
  it("200 — retourne la règle demandée", async () => {
    const cookie = withSession();
    findByIdMock.mockResolvedValueOnce({ id: "rule-1", label: "Sport & Bien-être" });

    const res = await request(app).get("/api/subsidy-rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "rule-1", label: "Sport & Bien-être" });
  });

  it("404 — règle introuvable (vérification directe, pas un catch)", async () => {
    const cookie = withSession();
    findByIdMock.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/subsidy-rules/rule-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Règle introuvable" });
  });

  it("500 — propage une erreur inattendue du repository", async () => {
    const cookie = withSession();
    findByIdMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/subsidy-rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

describe("POST /api/subsidy-rules", () => {
  it("201 — crée une règle de subvention", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "rule-1", ...validRuleBody });

    const res = await request(app).post("/api/subsidy-rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "rule-1", ...validRuleBody });
  });

  it("400 — rejette un corps invalide (libellé manquant)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/subsidy-rules").set("Cookie", cookie).send({ subsidyPct: 20 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.label).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Une règle avec ce libellé existe déjà"));

    const res = await request(app).post("/api/subsidy-rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Une règle avec ce libellé existe déjà" });
  });
});

describe("PUT /api/subsidy-rules/:id", () => {
  it("200 — met à jour une règle de subvention", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "rule-1", subsidyPct: 30 });

    const res = await request(app).put("/api/subsidy-rules/rule-1").set("Cookie", cookie).send({ subsidyPct: 30 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "rule-1", subsidyPct: 30 });
  });

  it("400 — rejette un corps invalide (pourcentage hors bornes)", async () => {
    const cookie = withSession();

    const res = await request(app).put("/api/subsidy-rules/rule-1").set("Cookie", cookie).send({ subsidyPct: 150 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.subsidyPct).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("404 — règle introuvable (vérification directe après update)", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce(null);

    const res = await request(app).put("/api/subsidy-rules/rule-inconnue").set("Cookie", cookie).send({ subsidyPct: 30 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Règle introuvable" });
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new Error("Conflit de priorité entre règles"));

    const res = await request(app).put("/api/subsidy-rules/rule-1").set("Cookie", cookie).send({ priority: 1 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Conflit de priorité entre règles" });
  });
});

describe("DELETE /api/subsidy-rules/:id", () => {
  it("200 — supprime une règle de subvention", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(true);

    const res = await request(app).delete("/api/subsidy-rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("404 — règle introuvable (vérification directe après delete)", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(false);

    const res = await request(app).delete("/api/subsidy-rules/rule-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Règle introuvable" });
  });

  it("500 — propage une erreur inattendue du repository", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).delete("/api/subsidy-rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});
