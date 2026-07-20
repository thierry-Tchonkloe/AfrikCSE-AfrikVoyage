// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/benefits (src/modules/benefits).
//
// Style d'erreur : mutations catchées manuellement → 400 { message } (style
// organization/user/settings) ; les GET (getCategories, getRequests,
// getApprovalStats, getBudgetReport, getComplianceReport) n'ont aucun
// try/catch → remontent au middleware d'erreurs global en cas d'erreur.
//
// RBAC — 5 configurations distinctes (401/403 testés une fois par groupe
// représentatif, voir organization.routes.test.ts pour la même logique) :
//   (a) SUPER_ADMIN, ADMIN, MANAGER        → GET /categories
//   (b) SUPER_ADMIN, ADMIN                 → POST/PATCH/DELETE /categories
//   (c) SUPER_ADMIN, ADMIN, MANAGER, RH    → GET /requests
//   (d) SUPER_ADMIN, ADMIN, MANAGER        → /requests/stats, approve, reject, bulk-approve
//   (e) SUPER_ADMIN, ADMIN, FINANCE        → /report, /compliance
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/benefits/application/benefit.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { BenefitService } from "../../../modules/benefits/application/benefit.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getCategoriesMock = BenefitService.prototype.getCategories as jest.Mock;
const createCategoryMock = BenefitService.prototype.createCategory as jest.Mock;
const updateCategoryMock = BenefitService.prototype.updateCategory as jest.Mock;
const deleteCategoryMock = BenefitService.prototype.deleteCategory as jest.Mock;
const getRequestsMock = BenefitService.prototype.getRequests as jest.Mock;
const getApprovalStatsMock = BenefitService.prototype.getApprovalStats as jest.Mock;
const approveRequestMock = BenefitService.prototype.approveRequest as jest.Mock;
const rejectRequestMock = BenefitService.prototype.rejectRequest as jest.Mock;
const bulkApproveMock = BenefitService.prototype.bulkApprove as jest.Mock;
const getBudgetReportMock = BenefitService.prototype.getBudgetReport as jest.Mock;
const getComplianceReportMock = BenefitService.prototype.getComplianceReport as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

const validCategoryBody = { name: "Sport & Bien-être", annualBudget: 500000, perEmployeeLimit: 50000 };

// ── GET /categories — représentative du groupe (a) ───────────────────────────
describe("GET /api/benefits/categories", () => {
  it("200 — retourne les catégories d'avantages de l'organisation", async () => {
    const cookie = withSession({ role: "MANAGER" });
    getCategoriesMock.mockResolvedValueOnce([{ id: "cat-1", name: "Sport & Bien-être" }]);

    const res = await request(app).get("/api/benefits/categories").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "cat-1", name: "Sport & Bien-être" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/benefits/categories");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/benefits/categories").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getCategoriesMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getCategoriesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/benefits/categories").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /categories — représentative du groupe (b) ──────────────────────────
describe("POST /api/benefits/categories", () => {
  it("201 — crée une catégorie d'avantages", async () => {
    const cookie = withSession();
    createCategoryMock.mockResolvedValueOnce({ id: "cat-1", ...validCategoryBody });

    const res = await request(app).post("/api/benefits/categories").set("Cookie", cookie).send(validCategoryBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "cat-1", ...validCategoryBody });
  });

  it("400 — rejette un corps invalide (budget manquant)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/benefits/categories").set("Cookie", cookie).send({ name: "X" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.annualBudget).toBeDefined();
    expect(createCategoryMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/benefits/categories").send(validCategoryBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un MANAGER (autorisé en lecture mais pas en écriture)", async () => {
    const cookie = withSession({ role: "MANAGER" });

    const res = await request(app).post("/api/benefits/categories").set("Cookie", cookie).send(validCategoryBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(createCategoryMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du service", async () => {
    const cookie = withSession();
    createCategoryMock.mockRejectedValueOnce(new Error("Une catégorie avec ce nom existe déjà"));

    const res = await request(app).post("/api/benefits/categories").set("Cookie", cookie).send(validCategoryBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Une catégorie avec ce nom existe déjà" });
  });
});

// ── PATCH /categories/:id — même groupe (b), 401/403 non répétés ────────────
describe("PATCH /api/benefits/categories/:id", () => {
  it("200 — met à jour une catégorie d'avantages", async () => {
    const cookie = withSession();
    updateCategoryMock.mockResolvedValueOnce({ id: "cat-1", name: "Sport & Loisirs" });

    const res = await request(app)
      .patch("/api/benefits/categories/cat-1")
      .set("Cookie", cookie)
      .send({ name: "Sport & Loisirs" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "cat-1", name: "Sport & Loisirs" });
  });

  it("400 — rejette un corps invalide (budget négatif)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/benefits/categories/cat-1")
      .set("Cookie", cookie)
      .send({ annualBudget: -100 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.annualBudget).toBeDefined();
    expect(updateCategoryMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (catégorie introuvable)", async () => {
    const cookie = withSession();
    updateCategoryMock.mockRejectedValueOnce(new Error("Catégorie introuvable"));

    const res = await request(app)
      .patch("/api/benefits/categories/cat-inconnue")
      .set("Cookie", cookie)
      .send({ name: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Catégorie introuvable" });
  });
});

// ── DELETE /categories/:id — même groupe (b) ─────────────────────────────────
describe("DELETE /api/benefits/categories/:id", () => {
  it("200 — supprime une catégorie d'avantages", async () => {
    const cookie = withSession();
    deleteCategoryMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/benefits/categories/cat-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Catégorie supprimée" });
  });

  it("400 — propage une erreur métier (catégorie utilisée par des demandes actives)", async () => {
    const cookie = withSession();
    deleteCategoryMock.mockRejectedValueOnce(new Error("Impossible de supprimer une catégorie utilisée"));

    const res = await request(app).delete("/api/benefits/categories/cat-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Impossible de supprimer une catégorie utilisée" });
  });
});

// ── GET /requests — représentative du groupe (c) ─────────────────────────────
describe("GET /api/benefits/requests", () => {
  it("200 — un RH reçoit les demandes d'avantages de l'organisation", async () => {
    const cookie = withSession({ role: "RH" });
    getRequestsMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });

    const res = await request(app).get("/api/benefits/requests").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 10 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/benefits/requests");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/benefits/requests").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getRequestsMock).not.toHaveBeenCalled();
  });
});

// ── GET /requests/stats — représentative du groupe (d) ───────────────────────
describe("GET /api/benefits/requests/stats", () => {
  it("200 — retourne les statistiques d'approbation", async () => {
    const cookie = withSession();
    getApprovalStatsMock.mockResolvedValueOnce({ pending: 3, approved: 10, rejected: 1 });

    const res = await request(app).get("/api/benefits/requests/stats").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pending: 3, approved: 10, rejected: 1 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/benefits/requests/stats");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un RH (autorisé sur /requests mais pas /requests/stats)", async () => {
    const cookie = withSession({ role: "RH" });

    const res = await request(app).get("/api/benefits/requests/stats").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getApprovalStatsMock).not.toHaveBeenCalled();
  });
});

// ── PATCH /requests/:id/approve — même groupe (d), 401/403 non répétés ──────
describe("PATCH /api/benefits/requests/:id/approve", () => {
  it("200 — approuve une demande d'avantage", async () => {
    const cookie = withSession();
    approveRequestMock.mockResolvedValueOnce({ id: "req-1", status: "APPROVED" });

    const res = await request(app).patch("/api/benefits/requests/req-1/approve").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "req-1", status: "APPROVED" });
  });

  it("400 — propage une erreur métier (demande déjà traitée)", async () => {
    const cookie = withSession();
    approveRequestMock.mockRejectedValueOnce(new Error("Cette demande a déjà été traitée"));

    const res = await request(app).patch("/api/benefits/requests/req-1/approve").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette demande a déjà été traitée" });
  });
});

// ── PATCH /requests/:id/reject — même groupe (d) ─────────────────────────────
describe("PATCH /api/benefits/requests/:id/reject", () => {
  it("200 — rejette une demande d'avantage avec un motif", async () => {
    const cookie = withSession();
    rejectRequestMock.mockResolvedValueOnce({ id: "req-1", status: "REJECTED" });

    const res = await request(app)
      .patch("/api/benefits/requests/req-1/reject")
      .set("Cookie", cookie)
      .send({ note: "Budget épuisé pour cette période" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "req-1", status: "REJECTED" });
  });

  it("400 — rejette un motif manquant (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/benefits/requests/req-1/reject").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.note).toBeDefined();
    expect(rejectRequestMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (demande déjà traitée)", async () => {
    const cookie = withSession();
    rejectRequestMock.mockRejectedValueOnce(new Error("Cette demande a déjà été traitée"));

    const res = await request(app)
      .patch("/api/benefits/requests/req-1/reject")
      .set("Cookie", cookie)
      .send({ note: "Budget épuisé" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette demande a déjà été traitée" });
  });
});

// ── POST /requests/bulk-approve — même groupe (d) ────────────────────────────
describe("POST /api/benefits/requests/bulk-approve", () => {
  it("200 — approuve plusieurs demandes en une fois", async () => {
    const cookie = withSession();
    bulkApproveMock.mockResolvedValueOnce({ succeeded: 2, failed: 0 });

    const res = await request(app)
      .post("/api/benefits/requests/bulk-approve")
      .set("Cookie", cookie)
      .send({ ids: ["req-1", "req-2"] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ succeeded: 2, failed: 0 });
  });

  it("400 — rejette une liste d'ids vide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/benefits/requests/bulk-approve").set("Cookie", cookie).send({ ids: [] });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.ids).toBeDefined();
    expect(bulkApproveMock).not.toHaveBeenCalled();
  });
});

// ── GET /report — représentative du groupe (e) ───────────────────────────────
describe("GET /api/benefits/report", () => {
  it("200 — un FINANCE reçoit le rapport budgétaire annuel", async () => {
    const cookie = withSession({ role: "FINANCE" });
    getBudgetReportMock.mockResolvedValueOnce({ year: 2026, totalSpent: 1200000 });

    const res = await request(app).get("/api/benefits/report?year=2026").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ year: 2026, totalSpent: 1200000 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/benefits/report");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un MANAGER (autorisé sur les catégories mais pas sur les rapports)", async () => {
    const cookie = withSession({ role: "MANAGER" });

    const res = await request(app).get("/api/benefits/report").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getBudgetReportMock).not.toHaveBeenCalled();
  });
});

// ── GET /compliance — même groupe (e), 401/403 non répétés ──────────────────
describe("GET /api/benefits/compliance", () => {
  it("200 — retourne le rapport de conformité", async () => {
    const cookie = withSession({ role: "FINANCE" });
    getComplianceReportMock.mockResolvedValueOnce({ compliant: true });

    const res = await request(app).get("/api/benefits/compliance").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ compliant: true });
  });
});
