// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/travels (src/modules/travels) —
// vue admin/staff des demandes de voyage ET des notes de frais associées.
// Distinct de /api/employee/travels (création côté employé, module employee).
//
// Pas de couche service : le contrôleur appelle `TravelRepository` directement
// (mocké) + `NotificationRepository` (best-effort, résultat ignoré). Style
// d'erreur "code fixe manuel" (comme organization/user/settings) sur les
// routes de mutation ; les GET n'ont aucun try/catch → errorMiddleware global.
// Aucune validation Zod dans ce contrôleur : `updateStatus` et `bulkApprove`
// font des vérifications manuelles minimales sur le corps de la requête.
//
// RBAC — 3 configurations distinctes (401/403 testés une fois par groupe) :
//   (a) SUPER_ADMIN, ADMIN, MANAGER, FINANCE → GET /, /stats, /expenses, /:id
//   (b) SUPER_ADMIN, ADMIN, MANAGER          → approbations/refus/statut/
//       partenaire/bulk-approve/expenses approve-reject
//   (c) SUPER_ADMIN, ADMIN, FINANCE          → /:id/payment, /expenses/stats
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/travels/infrastructure/travel.repository");
jest.mock("../../../modules/notification/infrastructure/notification.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { TravelRepository } from "../../../modules/travels/infrastructure/travel.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllMock = TravelRepository.prototype.getAll as jest.Mock;
const getByIdMock = TravelRepository.prototype.getById as jest.Mock;
const getStatsMock = TravelRepository.prototype.getStats as jest.Mock;
const approveMock = TravelRepository.prototype.approve as jest.Mock;
const rejectMock = TravelRepository.prototype.reject as jest.Mock;
const updateStatusMock = TravelRepository.prototype.updateStatus as jest.Mock;
const getApprovalStatsMock = TravelRepository.prototype.getApprovalStats as jest.Mock;
const bulkApproveMock = TravelRepository.prototype.bulkApprove as jest.Mock;
const assignPartnerMock = TravelRepository.prototype.assignPartner as jest.Mock;
const updatePaymentMock = TravelRepository.prototype.updatePayment as jest.Mock;
const getExpensesMock = TravelRepository.prototype.getExpenses as jest.Mock;
const getExpenseStatsMock = TravelRepository.prototype.getExpenseStats as jest.Mock;
const approveExpenseMock = TravelRepository.prototype.approveExpense as jest.Mock;
const rejectExpenseMock = TravelRepository.prototype.rejectExpense as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

const travelResult = { id: "travel-1", destination: "Cotonou", requestedById: "user-2" };

// ── GET / — représentative du groupe (a) ─────────────────────────────────────
describe("GET /api/travels", () => {
  it("200 — retourne les demandes de voyage de l'organisation", async () => {
    const cookie = withSession();
    getAllMock.mockResolvedValueOnce({ data: [travelResult], total: 1, page: 1, limit: 10 });

    const res = await request(app).get("/api/travels").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/travels");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/travels").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getAllMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getAllMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/travels").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /stats — même groupe (a) ─────────────────────────────────────────────
describe("GET /api/travels/stats", () => {
  it("200 — retourne les statistiques voyages de l'organisation", async () => {
    const cookie = withSession();
    getStatsMock.mockResolvedValueOnce({ total: 20, pending: 3 });

    const res = await request(app).get("/api/travels/stats").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 20, pending: 3 });
  });
});

// ── GET /:id — même groupe (a) ────────────────────────────────────────────────
describe("GET /api/travels/:id", () => {
  it("200 — retourne le détail d'un voyage", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce(travelResult);

    const res = await request(app).get("/api/travels/travel-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(travelResult);
  });

  it("404 — voyage introuvable (vérification directe, pas un catch)", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/travels/travel-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Réservation introuvable" });
  });
});

// ── GET /expenses — même groupe (a) ──────────────────────────────────────────
describe("GET /api/travels/expenses", () => {
  it("200 — retourne les notes de frais de l'organisation", async () => {
    const cookie = withSession();
    getExpensesMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });

    const res = await request(app).get("/api/travels/expenses").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 10 });
  });
});

// ── GET /approvals/stats — représentative du groupe (b) ──────────────────────
describe("GET /api/travels/approvals/stats", () => {
  it("200 — retourne les statistiques d'approbation", async () => {
    const cookie = withSession();
    getApprovalStatsMock.mockResolvedValueOnce({ pending: 3, approved: 15 });

    const res = await request(app).get("/api/travels/approvals/stats").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pending: 3, approved: 15 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/travels/approvals/stats");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un FINANCE (autorisé sur GET / mais pas sur les approbations)", async () => {
    const cookie = withSession({ role: "FINANCE" });

    const res = await request(app).get("/api/travels/approvals/stats").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getApprovalStatsMock).not.toHaveBeenCalled();
  });
});

// ── POST /bulk-approve — même groupe (b), 401/403 non répétés ───────────────
describe("POST /api/travels/bulk-approve", () => {
  it("200 — approuve plusieurs demandes en une fois", async () => {
    const cookie = withSession();
    bulkApproveMock.mockResolvedValueOnce({ count: 2, requests: [] });

    const res = await request(app).post("/api/travels/bulk-approve").set("Cookie", cookie).send({ ids: ["travel-1", "travel-2"] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 2 });
  });

  it("400 — rejette une liste d'ids vide (vérification manuelle, pas Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/travels/bulk-approve").set("Cookie", cookie).send({ ids: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Aucune demande sélectionnée" });
    expect(bulkApproveMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    bulkApproveMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/travels/bulk-approve").set("Cookie", cookie).send({ ids: ["travel-1"] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

// ── PATCH /:id/approve — même groupe (b) ─────────────────────────────────────
describe("PATCH /api/travels/:id/approve", () => {
  it("200 — approuve une demande de voyage", async () => {
    const cookie = withSession();
    approveMock.mockResolvedValueOnce(travelResult);

    const res = await request(app).patch("/api/travels/travel-1/approve").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(travelResult);
  });

  it("400 — propage une erreur métier (demande déjà traitée)", async () => {
    const cookie = withSession();
    approveMock.mockRejectedValueOnce(new Error("Cette demande a déjà été traitée"));

    const res = await request(app).patch("/api/travels/travel-1/approve").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette demande a déjà été traitée" });
  });
});

// ── PATCH /:id/reject — même groupe (b) ──────────────────────────────────────
describe("PATCH /api/travels/:id/reject", () => {
  it("200 — rejette une demande de voyage", async () => {
    const cookie = withSession();
    rejectMock.mockResolvedValueOnce({ ...travelResult, rejectionNote: "Budget dépassé" });

    const res = await request(app)
      .patch("/api/travels/travel-1/reject")
      .set("Cookie", cookie)
      .send({ note: "Budget dépassé" });

    expect(res.status).toBe(200);
    expect(res.body.rejectionNote).toBe("Budget dépassé");
  });

  it("400 — propage une erreur métier (demande déjà traitée)", async () => {
    const cookie = withSession();
    rejectMock.mockRejectedValueOnce(new Error("Cette demande a déjà été traitée"));

    const res = await request(app).patch("/api/travels/travel-1/reject").set("Cookie", cookie).send({ note: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette demande a déjà été traitée" });
  });
});

// ── PATCH /:id/status — même groupe (b) ──────────────────────────────────────
describe("PATCH /api/travels/:id/status", () => {
  it("200 — change le statut d'un voyage", async () => {
    const cookie = withSession();
    updateStatusMock.mockResolvedValueOnce({ ...travelResult, status: "IN_PROGRESS" });

    const res = await request(app)
      .patch("/api/travels/travel-1/status")
      .set("Cookie", cookie)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  it("400 — rejette un statut hors énumération (vérification manuelle)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/travels/travel-1/status").set("Cookie", cookie).send({ status: "ARCHIVED" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Statut invalide" });
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    updateStatusMock.mockRejectedValueOnce(new Error("Transition de statut invalide"));

    const res = await request(app)
      .patch("/api/travels/travel-1/status")
      .set("Cookie", cookie)
      .send({ status: "CANCELLED" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Transition de statut invalide" });
  });
});

// ── PATCH /:id/partner — même groupe (b) ─────────────────────────────────────
describe("PATCH /api/travels/:id/partner", () => {
  it("200 — assigne un partenaire à un voyage", async () => {
    const cookie = withSession();
    assignPartnerMock.mockResolvedValueOnce({ ...travelResult, partnerName: "Agence Voyage Plus" });

    const res = await request(app)
      .patch("/api/travels/travel-1/partner")
      .set("Cookie", cookie)
      .send({ partnerName: "Agence Voyage Plus" });

    expect(res.status).toBe(200);
    expect(res.body.partnerName).toBe("Agence Voyage Plus");
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    assignPartnerMock.mockRejectedValueOnce(new Error("Voyage introuvable"));

    const res = await request(app)
      .patch("/api/travels/travel-inconnu/partner")
      .set("Cookie", cookie)
      .send({ partnerName: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Voyage introuvable" });
  });
});

// ── PATCH /expenses/:id/approve — même groupe (b) ────────────────────────────
describe("PATCH /api/travels/expenses/:id/approve", () => {
  it("200 — approuve une note de frais", async () => {
    const cookie = withSession();
    approveExpenseMock.mockResolvedValueOnce({ id: "exp-1", title: "Taxi", employee: { userId: "user-2" } });

    const res = await request(app).patch("/api/travels/expenses/exp-1/approve").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("exp-1");
  });

  it("400 — propage une erreur métier (note déjà traitée)", async () => {
    const cookie = withSession();
    approveExpenseMock.mockRejectedValueOnce(new Error("Cette note de frais a déjà été traitée"));

    const res = await request(app).patch("/api/travels/expenses/exp-1/approve").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette note de frais a déjà été traitée" });
  });
});

// ── PATCH /expenses/:id/reject — même groupe (b) ─────────────────────────────
describe("PATCH /api/travels/expenses/:id/reject", () => {
  it("200 — rejette une note de frais", async () => {
    const cookie = withSession();
    rejectExpenseMock.mockResolvedValueOnce({
      id: "exp-1", title: "Taxi", rejectionNote: "Justificatif manquant", employee: { userId: "user-2" },
    });

    const res = await request(app)
      .patch("/api/travels/expenses/exp-1/reject")
      .set("Cookie", cookie)
      .send({ note: "Justificatif manquant" });

    expect(res.status).toBe(200);
    expect(res.body.rejectionNote).toBe("Justificatif manquant");
  });

  it("400 — propage une erreur métier (note déjà traitée)", async () => {
    const cookie = withSession();
    rejectExpenseMock.mockRejectedValueOnce(new Error("Cette note de frais a déjà été traitée"));

    const res = await request(app).patch("/api/travels/expenses/exp-1/reject").set("Cookie", cookie).send({ note: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette note de frais a déjà été traitée" });
  });
});

// ── PATCH /:id/payment — représentative du groupe (c) ────────────────────────
describe("PATCH /api/travels/:id/payment", () => {
  it("200 — un FINANCE met à jour le paiement d'un voyage", async () => {
    const cookie = withSession({ role: "FINANCE" });
    updatePaymentMock.mockResolvedValueOnce({ ...travelResult, paymentStatus: "PAID" });

    const res = await request(app)
      .patch("/api/travels/travel-1/payment")
      .set("Cookie", cookie)
      .send({ paymentStatus: "PAID" });

    expect(res.status).toBe(200);
    expect(res.body.paymentStatus).toBe("PAID");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/travels/travel-1/payment").send({ paymentStatus: "PAID" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un MANAGER (autorisé à approuver mais pas à gérer les paiements)", async () => {
    const cookie = withSession({ role: "MANAGER" });

    const res = await request(app)
      .patch("/api/travels/travel-1/payment")
      .set("Cookie", cookie)
      .send({ paymentStatus: "PAID" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(updatePaymentMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession({ role: "FINANCE" });
    updatePaymentMock.mockRejectedValueOnce(new Error("Voyage introuvable"));

    const res = await request(app)
      .patch("/api/travels/travel-inconnu/payment")
      .set("Cookie", cookie)
      .send({ paymentStatus: "PAID" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Voyage introuvable" });
  });
});

// ── GET /expenses/stats — même groupe (c), 401/403 non répétés ──────────────
describe("GET /api/travels/expenses/stats", () => {
  it("200 — retourne les statistiques des notes de frais", async () => {
    const cookie = withSession({ role: "FINANCE" });
    getExpenseStatsMock.mockResolvedValueOnce({ totalAmount: 500000 });

    const res = await request(app).get("/api/travels/expenses/stats").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalAmount: 500000 });
  });
});
