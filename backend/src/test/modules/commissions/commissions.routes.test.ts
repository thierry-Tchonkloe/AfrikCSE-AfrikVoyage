// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/commissions (src/modules/commissions).
//
// RBAC à DEUX niveaux (`authorize()` appliqué deux fois pour les routes
// sensibles) :
//   - Base (tout le routeur) : SUPER_ADMIN, PLATFORM_MANAGER, FINANCE, ADMIN
//   - Renforcé (mutations)   : SUPER_ADMIN seul, via un second `authorize()`
//     empilé sur les routes POST/PATCH/DELETE — un ADMIN passe donc le
//     premier filtre mais est bloqué par le second (403 testé explicitement).
// Style `next(err)` + errorMiddleware global (comme orders/cashback).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/commissions/application/commission.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { CommissionService } from "../../../modules/commissions/application/commission.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listRulesMock = CommissionService.prototype.listRules as jest.Mock;
const createRuleMock = CommissionService.prototype.createRule as jest.Mock;
const updateRuleMock = CommissionService.prototype.updateRule as jest.Mock;
const deleteRuleMock = CommissionService.prototype.deleteRule as jest.Mock;
const listEntriesMock = CommissionService.prototype.listEntries as jest.Mock;
const listPayoutsMock = CommissionService.prototype.listPayouts as jest.Mock;
const triggerPayoutMock = CommissionService.prototype.triggerPayout as jest.Mock;
const markPayoutPaidMock = CommissionService.prototype.markPayoutPaid as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

const validRuleBody = { type: "PERCENTAGE", rate: 0.1 };
const validPayoutBody = { partnerId: "clh3p9a1x0000qzrmn831i7am", period: "2026-07" };

describe("GET /api/commissions/rules", () => {
  it("200 — un FINANCE reçoit les règles de commission", async () => {
    const cookie = withSession({ role: "FINANCE" });
    listRulesMock.mockResolvedValueOnce([{ id: "rule-1", type: "PERCENTAGE" }]);

    const res = await request(app).get("/api/commissions/rules").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "rule-1", type: "PERCENTAGE" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/commissions/rules");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/commissions/rules").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listRulesMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listRulesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/commissions/rules").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/commissions/entries", () => {
  it("200 — retourne les lignes de commission", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    listEntriesMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 50 });

    const res = await request(app).get("/api/commissions/entries").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 50 });
  });
});

describe("GET /api/commissions/payouts", () => {
  it("200 — retourne les versements aux partenaires", async () => {
    const cookie = withSession({ role: "ADMIN" });
    listPayoutsMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });

    const res = await request(app).get("/api/commissions/payouts").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 20 });
  });
});

describe("POST /api/commissions/rules", () => {
  it("201 — un SUPER_ADMIN crée une règle de commission", async () => {
    const cookie = withSession();
    createRuleMock.mockResolvedValueOnce({ id: "rule-1", ...validRuleBody });

    const res = await request(app).post("/api/commissions/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "rule-1", ...validRuleBody });
  });

  it("400 — rejette un corps invalide (taux hors bornes)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/commissions/rules").set("Cookie", cookie).send({ type: "PERCENTAGE", rate: 2 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.rate).toBeDefined();
    expect(createRuleMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un ADMIN (autorisé en lecture mais pas pour créer une règle — RBAC à deux niveaux)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).post("/api/commissions/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(createRuleMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier", async () => {
    const cookie = withSession();
    createRuleMock.mockRejectedValueOnce(new AppError("Une règle existe déjà pour ce partenaire", 400));

    const res = await request(app).post("/api/commissions/rules").set("Cookie", cookie).send(validRuleBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Une règle existe déjà pour ce partenaire" });
  });
});

describe("PATCH /api/commissions/rules/:id", () => {
  it("200 — met à jour une règle de commission", async () => {
    const cookie = withSession();
    updateRuleMock.mockResolvedValueOnce({ id: "rule-1", rate: 0.15 });

    const res = await request(app).patch("/api/commissions/rules/rule-1").set("Cookie", cookie).send({ rate: 0.15 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "rule-1", rate: 0.15 });
  });

  it("400 — rejette un corps invalide (type hors énumération)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/commissions/rules/rule-1").set("Cookie", cookie).send({ type: "UNKNOWN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.type).toBeDefined();
    expect(updateRuleMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (règle introuvable)", async () => {
    const cookie = withSession();
    updateRuleMock.mockRejectedValueOnce(new AppError("Règle introuvable", 404));

    const res = await request(app).patch("/api/commissions/rules/rule-inconnue").set("Cookie", cookie).send({ rate: 0.2 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Règle introuvable" });
  });
});

describe("DELETE /api/commissions/rules/:id", () => {
  it("204 — supprime une règle de commission", async () => {
    const cookie = withSession();
    deleteRuleMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/commissions/rules/rule-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });

  it("404 — propage une AppError métier (règle introuvable)", async () => {
    const cookie = withSession();
    deleteRuleMock.mockRejectedValueOnce(new AppError("Règle introuvable", 404));

    const res = await request(app).delete("/api/commissions/rules/rule-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Règle introuvable" });
  });
});

describe("POST /api/commissions/payouts", () => {
  it("201 — déclenche un versement pour une période donnée", async () => {
    const cookie = withSession();
    triggerPayoutMock.mockResolvedValueOnce({ id: "payout-1", period: "2026-07" });

    const res = await request(app).post("/api/commissions/payouts").set("Cookie", cookie).send(validPayoutBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "payout-1", period: "2026-07" });
  });

  it("400 — rejette un format de période invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/commissions/payouts")
      .set("Cookie", cookie)
      .send({ ...validPayoutBody, period: "juillet 2026" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.period).toBeDefined();
    expect(triggerPayoutMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (aucune commission à verser)", async () => {
    const cookie = withSession();
    triggerPayoutMock.mockRejectedValueOnce(new AppError("Aucune commission à verser pour cette période", 400));

    const res = await request(app).post("/api/commissions/payouts").set("Cookie", cookie).send(validPayoutBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Aucune commission à verser pour cette période" });
  });
});

describe("PATCH /api/commissions/payouts/:id/paid", () => {
  it("200 — marque un versement comme payé", async () => {
    const cookie = withSession();
    markPayoutPaidMock.mockResolvedValueOnce({ id: "payout-1", status: "PAID" });

    const res = await request(app).patch("/api/commissions/payouts/payout-1/paid").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "payout-1", status: "PAID" });
  });

  it("400 — propage une AppError métier (déjà marqué payé)", async () => {
    const cookie = withSession();
    markPayoutPaidMock.mockRejectedValueOnce(new AppError("Ce versement est déjà marqué comme payé", 400));

    const res = await request(app).patch("/api/commissions/payouts/payout-1/paid").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Ce versement est déjà marqué comme payé" });
  });
});
