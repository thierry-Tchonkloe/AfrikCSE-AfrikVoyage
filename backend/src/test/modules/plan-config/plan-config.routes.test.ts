// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/plan-configs (src/modules/plan-config).
//
// GET /public est déclarée AVANT `router.use(authenticate)` : elle est donc
// VRAIMENT publique (utilisée par la page tarifs du site vitrine, sans cookie
// requis) — testé explicitement, ne pas confondre avec un oubli d'auth comme
// sur `contact`.
// Style "code fixe manuel" (comme organization/user/settings/subsidy-rules) :
// getById/create/update/delete catchent → {message}, pas de success:false.
// getAll/getPublic n'ont aucun try/catch → errorMiddleware global.
//
// RBAC : GET /public sans authentification ; GET /, GET /:id → authenticate
// seul (tout rôle) ; POST/PATCH/DELETE → authorize("SUPER_ADMIN").
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/plan-config/application/plan-config.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { PlanConfigService } from "../../../modules/plan-config/application/plan-config.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllMock = PlanConfigService.prototype.getAll as jest.Mock;
const getPublicMock = PlanConfigService.prototype.getPublic as jest.Mock;
const getByIdMock = PlanConfigService.prototype.getById as jest.Mock;
const createMock = PlanConfigService.prototype.create as jest.Mock;
const updateMock = PlanConfigService.prototype.update as jest.Mock;
const deleteMock = PlanConfigService.prototype.delete as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

const validPlanBody = { name: "BUSINESS", label: "Business", price: "50000" };

describe("GET /api/plan-configs/public", () => {
  it("200 — retourne les plans SANS authentification requise (page tarifs vitrine)", async () => {
    getPublicMock.mockResolvedValueOnce([{ name: "STARTER", label: "Starter", price: "20000" }]);

    const res = await request(app).get("/api/plan-configs/public");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ name: "STARTER", label: "Starter", price: "20000" }]);
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    getPublicMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/plan-configs/public");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/plan-configs", () => {
  it("200 — retourne tous les plans avec leur nombre d'organisations (tout utilisateur authentifié)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });
    getAllMock.mockResolvedValueOnce([{ name: "BUSINESS", orgCount: 12 }]);

    const res = await request(app).get("/api/plan-configs").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ name: "BUSINESS", orgCount: 12 }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/plan-configs");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getAllMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/plan-configs").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/plan-configs/:id", () => {
  it("200 — retourne le détail d'un plan", async () => {
    const cookie = withSession({ role: "ADMIN" });
    getByIdMock.mockResolvedValueOnce({ name: "BUSINESS", label: "Business" });

    const res = await request(app).get("/api/plan-configs/BUSINESS").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ name: "BUSINESS", label: "Business" });
  });

  it("404 — plan introuvable (catch manuel, toujours 404)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Plan introuvable"));

    const res = await request(app).get("/api/plan-configs/PLAN_INCONNU").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Plan introuvable" });
  });
});

describe("POST /api/plan-configs", () => {
  it("201 — un SUPER_ADMIN crée un plan tarifaire", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "plan-1", ...validPlanBody });

    const res = await request(app).post("/api/plan-configs").set("Cookie", cookie).send(validPlanBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "plan-1", ...validPlanBody });
  });

  it("400 — rejette un corps invalide (nom en minuscules)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/plan-configs")
      .set("Cookie", cookie)
      .send({ ...validPlanBody, name: "business" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.name).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/plan-configs").send(validPlanBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).post("/api/plan-configs").set("Cookie", cookie).send(validPlanBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (nom déjà utilisé)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Un plan avec ce nom existe déjà"));

    const res = await request(app).post("/api/plan-configs").set("Cookie", cookie).send(validPlanBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Un plan avec ce nom existe déjà" });
  });
});

describe("PATCH /api/plan-configs/:id", () => {
  it("200 — met à jour un plan tarifaire", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "plan-1", price: "55000" });

    const res = await request(app).patch("/api/plan-configs/BUSINESS").set("Cookie", cookie).send({ price: "55000" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "plan-1", price: "55000" });
  });

  it("400 — rejette un corps invalide (champ non whitelisté, schéma .strict())", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/plan-configs/BUSINESS").set("Cookie", cookie).send({ name: "AUTRE_NOM" });

    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (plan introuvable)", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new Error("Plan introuvable"));

    const res = await request(app).patch("/api/plan-configs/PLAN_INCONNU").set("Cookie", cookie).send({ price: "1000" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Plan introuvable" });
  });
});

describe("DELETE /api/plan-configs/:id", () => {
  it("200 — supprime un plan tarifaire inutilisé", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/plan-configs/BUSINESS").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Plan supprimé" });
  });

  it("400 — propage une erreur métier (plan encore utilisé par des organisations)", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new Error("Impossible de supprimer un plan utilisé par des organisations"));

    const res = await request(app).delete("/api/plan-configs/BUSINESS").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Impossible de supprimer un plan utilisé par des organisations" });
  });
});
