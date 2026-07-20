// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/travel-policies (src/modules/travel-policies).
//
// Style d'erreur "statusCode dynamique" (comme family-members/group-travel) :
// `res.status(err.statusCode ?? 500).json({message})` — une AppError mockée
// avec son propre code est respectée telle quelle.
//
// Une seule config RBAC pour tout le routeur (authenticate + authorize(ADMIN,
// MANAGER, SUPER_ADMIN)) → 401/403 testés une seule fois, sur GET /.
// `list` n'a aucun try/catch → remonte au middleware d'erreurs global.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/travel-policies/application/travel-policy.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { TravelPolicyService } from "../../../modules/travel-policies/application/travel-policy.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listMock = TravelPolicyService.prototype.list as jest.Mock;
const getByIdMock = TravelPolicyService.prototype.getById as jest.Mock;
const createMock = TravelPolicyService.prototype.create as jest.Mock;
const updateMock = TravelPolicyService.prototype.update as jest.Mock;
const deleteMock = TravelPolicyService.prototype.delete as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

const validBody = { name: "Politique Standard", maxFlightBudget: 500000 };

describe("GET /api/travel-policies", () => {
  it("200 — retourne les politiques de voyage de l'organisation", async () => {
    const cookie = withSession();
    listMock.mockResolvedValueOnce([{ id: "policy-1", name: "Politique Standard" }]);

    const res = await request(app).get("/api/travel-policies").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "policy-1", name: "Politique Standard" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/travel-policies");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/travel-policies").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/travel-policies").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/travel-policies", () => {
  it("201 — crée une politique de voyage", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "policy-1", ...validBody });

    const res = await request(app).post("/api/travel-policies").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "policy-1", ...validBody });
  });

  it("400 — rejette un corps invalide (nom manquant)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/travel-policies").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.name).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (politique par défaut déjà existante)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new AppError("Une politique par défaut existe déjà", 400));

    const res = await request(app).post("/api/travel-policies").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Une politique par défaut existe déjà" });
  });
});

describe("GET /api/travel-policies/:id", () => {
  it("200 — retourne la politique demandée", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "policy-1", name: "Politique Standard" });

    const res = await request(app).get("/api/travel-policies/policy-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "policy-1", name: "Politique Standard" });
  });

  it("404 — politique introuvable (statusCode lu depuis l'AppError)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new AppError("Politique introuvable", 404));

    const res = await request(app).get("/api/travel-policies/policy-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Politique introuvable" });
  });

  it("500 — une erreur générique (sans statusCode) retombe sur 500 par défaut", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Erreur inattendue"));

    const res = await request(app).get("/api/travel-policies/policy-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Erreur inattendue" });
  });
});

describe("PATCH /api/travel-policies/:id", () => {
  it("200 — met à jour une politique de voyage", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "policy-1", name: "Politique Modifiée" });

    const res = await request(app)
      .patch("/api/travel-policies/policy-1")
      .set("Cookie", cookie)
      .send({ name: "Politique Modifiée" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "policy-1", name: "Politique Modifiée" });
  });

  it("400 — rejette un corps invalide (budget négatif)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/travel-policies/policy-1")
      .set("Cookie", cookie)
      .send({ maxFlightBudget: -100 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.maxFlightBudget).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("404 — politique introuvable", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new AppError("Politique introuvable", 404));

    const res = await request(app)
      .patch("/api/travel-policies/policy-inconnue")
      .set("Cookie", cookie)
      .send({ name: "X" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Politique introuvable" });
  });
});

describe("DELETE /api/travel-policies/:id", () => {
  it("200 — supprime une politique de voyage", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/travel-policies/policy-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Politique supprimée" });
  });

  it("400 — propage une AppError métier (politique utilisée par défaut)", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new AppError("Impossible de supprimer la politique par défaut", 400));

    const res = await request(app).delete("/api/travel-policies/policy-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Impossible de supprimer la politique par défaut" });
  });
});
