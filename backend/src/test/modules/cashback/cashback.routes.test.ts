// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/cashback (src/modules/cashback).
//
// Stratégie d'isolation (identique aux modules auth/orders) :
// - `core/config/prisma` → mocké : utilisé par `authenticate`.
// - `core/utils/jwt` → mocké : contrôle le payload décodé du cookie de session.
// - `modules/cashback/application/cashback.service` → mocké (automock) : isole
//   le routing/validation/authorize/contrôleur du moteur de calcul réel
//   (règles, anti-fraude, crédit wallet…).
// - `session-helpers.ts` (mockAuthenticatedSession) réutilisé tel quel.
//
// Toutes les routes sauf GET /my sont protégées par `authorize()` avec des
// listes de rôles différentes selon la sensibilité (règles/transactions vs
// signaux de fraude réservés SUPER_ADMIN/PLATFORM_MANAGER) → cas 403 testés
// systématiquement avec un rôle EMPLOYE (ou ADMIN quand ADMIN lui-même n'est
// pas dans la liste autorisée, ex: fraud-signals).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/cashback/application/cashback.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { CashbackService } from "../../../modules/cashback/application/cashback.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

// Instance singleton créée au chargement de cashback.controller.ts — en automock,
// les méthodes du prototype sont partagées par toute instance `new CashbackService()`.
const listRulesMock = CashbackService.prototype.listRules as jest.Mock;
const createRuleMock = CashbackService.prototype.createRule as jest.Mock;
const updateRuleMock = CashbackService.prototype.updateRule as jest.Mock;
const deleteRuleMock = CashbackService.prototype.deleteRule as jest.Mock;
const listMyTransactionsMock = CashbackService.prototype.listMyTransactions as jest.Mock;
const listTransactionsMock = CashbackService.prototype.listTransactions as jest.Mock;
const listFraudSignalsMock = CashbackService.prototype.listFraudSignals as jest.Mock;
const reviewFraudSignalMock = CashbackService.prototype.reviewFraudSignal as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

/** Simule une erreur Prisma "enregistrement introuvable" (P2025), telle que
 * remontée par le repository sous-jacent lors d'un update/delete sur un id
 * inexistant — traduite en 404 par le middleware d'erreurs global. */
function notFoundPrismaError() {
  const err: Error & { code?: string } = new Error("Record to update not found");
  err.code = "P2025";
  return err;
}

const validRuleBody = { type: "MERCHANT", rate: 0.05 };

// ── GET /my — mes transactions cashback (authenticate seul) ─────────────────
describe("GET /api/cashback/my", () => {
  it("200 — retourne mes transactions cashback paginées", async () => {
    const cookie = withSession();
    listMyTransactionsMock.mockResolvedValueOnce({ data: [{ id: "txn-1" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/cashback/my").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(listMyTransactionsMock).toHaveBeenCalledWith("user-1", 1, 20);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/cashback/my");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(listMyTransactionsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    listMyTransactionsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/cashback/my").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /rules — authorize(ADMIN, FINANCE, MANAGER, SUPER_ADMIN, PLATFORM_MANAGER) ──
describe("GET /api/cashback/rules", () => {
  it("200 — un ADMIN reçoit les règles de son organisation", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1", isHost: false });
    listRulesMock.mockResolvedValueOnce([{ id: "rule-1", type: "MERCHANT" }]);

    const res = await request(app).get("/api/cashback/rules").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "rule-1", type: "MERCHANT" }]);
    expect(listRulesMock).toHaveBeenCalledWith("org-1");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/cashback/rules");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/cashback/rules").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listRulesMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "FINANCE" });
    listRulesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/cashback/rules").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /rules — authorize(ADMIN, SUPER_ADMIN) ──────────────────────────────
describe("POST /api/cashback/rules", () => {
  it("201 — crée une règle pour l'organisation de l'ADMIN", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1", isHost: false });
    createRuleMock.mockResolvedValueOnce({ id: "rule-1", ...validRuleBody });

    const res = await request(app).post("/api/cashback/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "rule-1", ...validRuleBody });
    expect(createRuleMock).toHaveBeenCalledWith("org-1", expect.objectContaining(validRuleBody));
  });

  it("201 — un SUPER_ADMIN « host » crée une règle plateforme (organizationId=null)", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN", organizationId: null, isHost: true });
    createRuleMock.mockResolvedValueOnce({ id: "rule-global", ...validRuleBody });

    const res = await request(app).post("/api/cashback/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(201);
    expect(createRuleMock).toHaveBeenCalledWith(null, expect.objectContaining(validRuleBody));
  });

  it("400 — rejette un corps invalide (validation Zod)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .post("/api/cashback/rules")
      .set("Cookie", cookie)
      .send({ type: "INVALID_TYPE", rate: 2 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.type).toBeDefined();
    expect(res.body.errors.fieldErrors.rate).toBeDefined();
    expect(createRuleMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/cashback/rules").send(validRuleBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).post("/api/cashback/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(createRuleMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "ADMIN" });
    createRuleMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/cashback/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /rules/:id — authorize(ADMIN, SUPER_ADMIN) ─────────────────────────
describe("PATCH /api/cashback/rules/:id", () => {
  it("200 — met à jour une règle existante", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1", isHost: false });
    updateRuleMock.mockResolvedValueOnce({ id: "rule-1", rate: 0.1, isActive: true });

    const res = await request(app)
      .patch("/api/cashback/rules/rule-1")
      .set("Cookie", cookie)
      .send({ rate: 0.1, isActive: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "rule-1", rate: 0.1, isActive: true });
    expect(updateRuleMock).toHaveBeenCalledWith("rule-1", "org-1", expect.objectContaining({ rate: 0.1 }));
  });

  it("400 — rejette un corps invalide (taux hors limites)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .patch("/api/cashback/rules/rule-1")
      .set("Cookie", cookie)
      .send({ rate: 1.5 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.rate).toBeDefined();
    expect(updateRuleMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/cashback/rules/rule-1").send({ rate: 0.1 });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app)
      .patch("/api/cashback/rules/rule-1")
      .set("Cookie", cookie)
      .send({ rate: 0.1 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(updateRuleMock).not.toHaveBeenCalled();
  });

  it("404 — la règle à modifier n'existe pas", async () => {
    const cookie = withSession({ role: "ADMIN" });
    updateRuleMock.mockRejectedValueOnce(notFoundPrismaError());

    const res = await request(app)
      .patch("/api/cashback/rules/rule-inconnue")
      .set("Cookie", cookie)
      .send({ rate: 0.1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "ADMIN" });
    updateRuleMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .patch("/api/cashback/rules/rule-1")
      .set("Cookie", cookie)
      .send({ rate: 0.1 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── DELETE /rules/:id — authorize(ADMIN, SUPER_ADMIN) ────────────────────────
describe("DELETE /api/cashback/rules/:id", () => {
  it("204 — supprime une règle existante", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN", organizationId: "org-1", isHost: false });
    deleteRuleMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/cashback/rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(deleteRuleMock).toHaveBeenCalledWith("rule-1", "org-1");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).delete("/api/cashback/rules/rule-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).delete("/api/cashback/rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(deleteRuleMock).not.toHaveBeenCalled();
  });

  it("404 — la règle à supprimer n'existe pas", async () => {
    const cookie = withSession({ role: "ADMIN" });
    deleteRuleMock.mockRejectedValueOnce(notFoundPrismaError());

    const res = await request(app).delete("/api/cashback/rules/rule-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "ADMIN" });
    deleteRuleMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).delete("/api/cashback/rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /transactions — authorize(ADMIN, FINANCE, SUPER_ADMIN, PLATFORM_MANAGER) ──
describe("GET /api/cashback/transactions", () => {
  it("200 — un FINANCE reçoit les transactions de l'organisation", async () => {
    const cookie = withSession({ role: "FINANCE", organizationId: "org-1" });
    listTransactionsMock.mockResolvedValueOnce({ data: [{ id: "txn-1" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/cashback/transactions").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(listTransactionsMock).toHaveBeenCalledWith("org-1", 1, 20);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/cashback/transactions");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/cashback/transactions").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listTransactionsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    listTransactionsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/cashback/transactions").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /fraud-signals — authorize(SUPER_ADMIN, PLATFORM_MANAGER) ────────────
describe("GET /api/cashback/fraud-signals", () => {
  it("200 — un SUPER_ADMIN reçoit les signaux de fraude filtrés", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    listFraudSignalsMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });

    const res = await request(app).get("/api/cashback/fraud-signals?reviewed=false").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(listFraudSignalsMock).toHaveBeenCalledWith(false, 1, 20);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/cashback/fraud-signals");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un ADMIN (non autorisé sur les signaux de fraude)", async () => {
    // ADMIN est autorisé sur /rules et /transactions mais pas ici : seuls
    // SUPER_ADMIN et PLATFORM_MANAGER ont accès aux signaux de fraude.
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/cashback/fraud-signals").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listFraudSignalsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    listFraudSignalsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/cashback/fraud-signals").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /fraud-signals/:id/review — authorize(SUPER_ADMIN, PLATFORM_MANAGER) ──
describe("PATCH /api/cashback/fraud-signals/:id/review", () => {
  it("200 — marque un signal de fraude comme revu", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN", userId: "reviewer-1" });
    reviewFraudSignalMock.mockResolvedValueOnce({ id: "signal-1", reviewedById: "reviewer-1" });

    const res = await request(app).patch("/api/cashback/fraud-signals/signal-1/review").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "signal-1", reviewedById: "reviewer-1" });
    expect(reviewFraudSignalMock).toHaveBeenCalledWith("signal-1", "reviewer-1");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/cashback/fraud-signals/signal-1/review");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un ADMIN (non autorisé sur les signaux de fraude)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).patch("/api/cashback/fraud-signals/signal-1/review").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(reviewFraudSignalMock).not.toHaveBeenCalled();
  });

  it("404 — le signal de fraude à revoir n'existe pas", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    reviewFraudSignalMock.mockRejectedValueOnce(notFoundPrismaError());

    const res = await request(app)
      .patch("/api/cashback/fraud-signals/signal-inconnu/review")
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    reviewFraudSignalMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/cashback/fraud-signals/signal-1/review").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
