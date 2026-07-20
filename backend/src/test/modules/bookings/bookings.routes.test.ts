// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/bookings (src/modules/bookings).
//
// Stratégie d'isolation (identique aux modules précédents) :
// - `core/config/prisma` → mocké : utilisé par `authenticate` ET `authenticatePartner`.
// - `core/utils/jwt` → mocké : contrôle le payload décodé côté session employé.
// - `modules/bookings/application/booking.service` → mocké (automock) : isole
//   le routing/validation/authorize/contrôleur du moteur métier réel (wallet,
//   commissions, notifications…).
// - `session-helpers.ts` réutilisé : `mockAuthenticatedSession` (employé) et
//   `mockAuthenticatedPartnerSession` (partenaire, JWT réel — voir ce fichier).
//
// Ce module est le plus riche en erreurs métier rencontré jusqu'ici : BookingService
// lève des `AppError` pour quasiment toutes les transitions d'état invalides
// (ex: confirmer une réservation qui n'est pas PENDING, noter une réservation
// qui n'est pas COMPLETED...). Il expose aussi DEUX notions de « 403 » à ne pas
// confondre :
//   - RBAC (authorize()) sur /admin/all → { message: "Accès interdit" }
//   - Isolation métier (AppError levée par le service quand une réservation
//     n'appartient pas à l'utilisateur/partenaire courant) → { success:false,
//     message: "Accès interdit" } — même texte, forme de réponse différente.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/bookings/application/booking.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { BookingService } from "../../../modules/bookings/application/booking.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession, mockAuthenticatedPartnerSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

// Instance singleton créée au chargement de booking.controller.ts — en automock,
// les méthodes du prototype sont partagées par toute instance `new BookingService()`.
const createMock = BookingService.prototype.create as jest.Mock;
const getMyBookingsMock = BookingService.prototype.getMyBookings as jest.Mock;
const getByIdMock = BookingService.prototype.getById as jest.Mock;
const cancelByUserMock = BookingService.prototype.cancelByUser as jest.Mock;
const rateMock = BookingService.prototype.rate as jest.Mock;
const getPartnerBookingsMock = BookingService.prototype.getPartnerBookings as jest.Mock;
const confirmMock = BookingService.prototype.confirm as jest.Mock;
const rejectMock = BookingService.prototype.reject as jest.Mock;
const completeMock = BookingService.prototype.complete as jest.Mock;
const getAllForAdminMock = BookingService.prototype.getAllForAdmin as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

function withPartnerSession(overrides: Parameters<typeof mockAuthenticatedPartnerSession>[1] = {}) {
  return mockAuthenticatedPartnerSession(prismaMock, overrides);
}

const validBookingBody = {
  partnerId: "clh3p9a1x0000qzrmn831i7am",
  bookingDate: new Date(Date.now() + 86400000).toISOString(),
  idempotencyKey: "idem-key-12345",
  paymentMethod: "WALLET",
  amount: 15000,
};

// ── POST / — créer une réservation ───────────────────────────────────────────
describe("POST /api/bookings", () => {
  it("201 — crée une réservation avec un corps valide", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "booking-1", status: "PENDING" });

    const res = await request(app).post("/api/bookings").set("Cookie", cookie).send(validBookingBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "booking-1", status: "PENDING" });
    expect(createMock).toHaveBeenCalledWith("user-1", "org-1", expect.objectContaining({ partnerId: validBookingBody.partnerId }));
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).post("/api/bookings").set("Cookie", cookie).send(validBookingBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un corps invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/bookings").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.partnerId).toBeDefined();
    expect(res.body.errors.fieldErrors.bookingDate).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/bookings").send(validBookingBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/bookings").set("Cookie", cookie).send(validBookingBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET / — mes réservations (aucune vérification d'organisation) ───────────
describe("GET /api/bookings", () => {
  it("200 — retourne mes réservations paginées", async () => {
    const cookie = withSession();
    getMyBookingsMock.mockResolvedValueOnce({ data: [{ id: "booking-1" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/bookings").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(getMyBookingsMock).toHaveBeenCalledWith("user-1", 1, 20);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/bookings");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getMyBookingsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/bookings").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /:id — détail d'une réservation ──────────────────────────────────────
describe("GET /api/bookings/:id", () => {
  it("200 — retourne la réservation demandée", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "booking-1", status: "CONFIRMED" });

    const res = await request(app).get("/api/bookings/booking-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "booking-1", status: "CONFIRMED" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/bookings/booking-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("404 — réservation introuvable OU n'appartenant pas à l'utilisateur (anti-IDOR, même message)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new AppError("Réservation introuvable", 404));

    const res = await request(app).get("/api/bookings/booking-dun-autre").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Réservation introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/bookings/booking-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── DELETE /:id — annulation par l'employé ───────────────────────────────────
describe("DELETE /api/bookings/:id", () => {
  it("204 — annule la réservation demandée", async () => {
    const cookie = withSession();
    cancelByUserMock.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete("/api/bookings/booking-1")
      .set("Cookie", cookie)
      .send({ reason: "Empêchement" });

    expect(res.status).toBe(204);
    expect(cancelByUserMock).toHaveBeenCalledWith("booking-1", "user-1", "Empêchement");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).delete("/api/bookings/booking-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("404 — la réservation à annuler n'existe pas", async () => {
    const cookie = withSession();
    cancelByUserMock.mockRejectedValueOnce(new AppError("Réservation introuvable", 404));

    const res = await request(app).delete("/api/bookings/booking-inconnue").set("Cookie", cookie).send({});

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Réservation introuvable" });
  });

  it("403 — refuse l'annulation d'une réservation appartenant à un autre utilisateur", async () => {
    const cookie = withSession();
    cancelByUserMock.mockRejectedValueOnce(new AppError("Accès interdit", 403));

    const res = await request(app).delete("/api/bookings/booking-dun-autre").set("Cookie", cookie).send({});

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "Accès interdit" });
  });

  it("400 — refuse d'annuler une réservation déjà complétée ou annulée", async () => {
    const cookie = withSession();
    cancelByUserMock.mockRejectedValueOnce(new AppError("Cette réservation ne peut pas être annulée", 400));

    const res = await request(app).delete("/api/bookings/booking-1").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Cette réservation ne peut pas être annulée" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    cancelByUserMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).delete("/api/bookings/booking-1").set("Cookie", cookie).send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /:id/rate — noter une réservation complétée ─────────────────────────
describe("POST /api/bookings/:id/rate", () => {
  it("200 — note une réservation complétée", async () => {
    const cookie = withSession();
    rateMock.mockResolvedValueOnce({ id: "rating-1", score: 5 });

    const res = await request(app)
      .post("/api/bookings/booking-1/rate")
      .set("Cookie", cookie)
      .send({ score: 5, comment: "Excellent" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "rating-1", score: 5 });
    expect(rateMock).toHaveBeenCalledWith("booking-1", "user-1", 5, "Excellent");
  });

  it("400 — rejette une note hors des bornes 1-5 (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/bookings/booking-1/rate").set("Cookie", cookie).send({ score: 0 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.score).toBeDefined();
    expect(rateMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/bookings/booking-1/rate").send({ score: 5 });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("404 — la réservation à noter n'existe pas", async () => {
    const cookie = withSession();
    rateMock.mockRejectedValueOnce(new AppError("Réservation introuvable", 404));

    const res = await request(app)
      .post("/api/bookings/booking-inconnue/rate")
      .set("Cookie", cookie)
      .send({ score: 5 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Réservation introuvable" });
  });

  it("403 — refuse de noter une réservation appartenant à un autre utilisateur", async () => {
    const cookie = withSession();
    rateMock.mockRejectedValueOnce(new AppError("Accès interdit", 403));

    const res = await request(app)
      .post("/api/bookings/booking-dun-autre/rate")
      .set("Cookie", cookie)
      .send({ score: 5 });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "Accès interdit" });
  });

  it("400 — refuse de noter une réservation qui n'est pas encore complétée", async () => {
    const cookie = withSession();
    rateMock.mockRejectedValueOnce(new AppError("Vous ne pouvez noter qu'une réservation complétée", 400));

    const res = await request(app).post("/api/bookings/booking-1/rate").set("Cookie", cookie).send({ score: 5 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Vous ne pouvez noter qu'une réservation complétée" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    rateMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/bookings/booking-1/rate").set("Cookie", cookie).send({ score: 5 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /partner — réservations du partenaire connecté (authenticatePartner) ──
describe("GET /api/bookings/partner", () => {
  it("200 — retourne les réservations paginées du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    getPartnerBookingsMock.mockResolvedValueOnce({ data: [{ id: "booking-1" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/bookings/partner").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getPartnerBookingsMock).toHaveBeenCalledWith("partner-1", 1, 20);
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/bookings/partner");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
    expect(getPartnerBookingsMock).not.toHaveBeenCalled();
  });

  it("401 — rejette un token partenaire invalide", async () => {
    const res = await request(app)
      .get("/api/bookings/partner")
      .set("Cookie", ["partnerAccessToken=token-invalide-et-mal-forme"]);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire invalide ou expiré" });
    expect(getPartnerBookingsMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une session partenaire révoquée (tokenVersion obsolète)", async () => {
    const cookie = withPartnerSession();
    // Écrase la réponse mockée par mockAuthenticatedPartnerSession pour simuler
    // une révocation (déconnexion) survenue après l'émission du token.
    prismaMock.partnerUser.findUnique.mockReset();
    prismaMock.partnerUser.findUnique.mockResolvedValueOnce({ tokenVersion: 99, isActive: true } as never);

    const res = await request(app).get("/api/bookings/partner").set("Cookie", cookie);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Session partenaire expirée, veuillez vous reconnecter" });
    expect(getPartnerBookingsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    getPartnerBookingsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/bookings/partner").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /partner/:id/confirm — le partenaire confirme une réservation PENDING ──
describe("PATCH /api/bookings/partner/:id/confirm", () => {
  it("200 — confirme une réservation PENDING", async () => {
    const cookie = withPartnerSession();
    confirmMock.mockResolvedValueOnce({ id: "booking-1", status: "CONFIRMED" });

    const res = await request(app)
      .patch("/api/bookings/partner/booking-1/confirm")
      .set("Cookie", cookie)
      .send({ notes: "Table prête à 19h" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "booking-1", status: "CONFIRMED" });
    expect(confirmMock).toHaveBeenCalledWith("booking-1", "partner-1", "Table prête à 19h");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/bookings/partner/booking-1/confirm");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — la réservation à confirmer n'existe pas", async () => {
    const cookie = withPartnerSession();
    confirmMock.mockRejectedValueOnce(new AppError("Réservation introuvable", 404));

    const res = await request(app)
      .patch("/api/bookings/partner/booking-inconnue/confirm")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Réservation introuvable" });
  });

  it("403 — refuse la confirmation d'une réservation appartenant à un autre partenaire (isolation multi-tenant)", async () => {
    const cookie = withPartnerSession();
    confirmMock.mockRejectedValueOnce(new AppError("Accès interdit", 403));

    const res = await request(app)
      .patch("/api/bookings/partner/booking-dun-autre-partenaire/confirm")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "Accès interdit" });
  });

  it("400 — refuse de confirmer une réservation qui n'est plus PENDING", async () => {
    const cookie = withPartnerSession();
    confirmMock.mockRejectedValueOnce(new AppError("Seule une réservation PENDING peut être confirmée", 400));

    const res = await request(app).patch("/api/bookings/partner/booking-1/confirm").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Seule une réservation PENDING peut être confirmée" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    confirmMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/bookings/partner/booking-1/confirm").set("Cookie", cookie).send({});

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /partner/:id/reject — le partenaire refuse une réservation PENDING ──
describe("PATCH /api/bookings/partner/:id/reject", () => {
  it("204 — refuse une réservation PENDING avec un motif", async () => {
    const cookie = withPartnerSession();
    rejectMock.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .patch("/api/bookings/partner/booking-1/reject")
      .set("Cookie", cookie)
      .send({ reason: "Complet à cette date" });

    expect(res.status).toBe(204);
    expect(rejectMock).toHaveBeenCalledWith("booking-1", "partner-1", "Complet à cette date");
  });

  it("400 — rejette un motif manquant (validation Zod)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app).patch("/api/bookings/partner/booking-1/reject").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.reason).toBeDefined();
    expect(rejectMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/bookings/partner/booking-1/reject").send({ reason: "Complet" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — la réservation à refuser n'existe pas", async () => {
    const cookie = withPartnerSession();
    rejectMock.mockRejectedValueOnce(new AppError("Réservation introuvable", 404));

    const res = await request(app)
      .patch("/api/bookings/partner/booking-inconnue/reject")
      .set("Cookie", cookie)
      .send({ reason: "Complet" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Réservation introuvable" });
  });

  it("403 — refuse le refus d'une réservation appartenant à un autre partenaire", async () => {
    const cookie = withPartnerSession();
    rejectMock.mockRejectedValueOnce(new AppError("Accès interdit", 403));

    const res = await request(app)
      .patch("/api/bookings/partner/booking-dun-autre-partenaire/reject")
      .set("Cookie", cookie)
      .send({ reason: "Complet" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "Accès interdit" });
  });

  it("400 — refuse de rejeter une réservation qui n'est plus PENDING", async () => {
    const cookie = withPartnerSession();
    rejectMock.mockRejectedValueOnce(new AppError("Seule une réservation PENDING peut être refusée", 400));

    const res = await request(app)
      .patch("/api/bookings/partner/booking-1/reject")
      .set("Cookie", cookie)
      .send({ reason: "Complet" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Seule une réservation PENDING peut être refusée" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    rejectMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .patch("/api/bookings/partner/booking-1/reject")
      .set("Cookie", cookie)
      .send({ reason: "Complet" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /partner/:id/complete — le partenaire complète une réservation CONFIRMED ──
describe("PATCH /api/bookings/partner/:id/complete", () => {
  it("200 — complète une réservation CONFIRMED", async () => {
    const cookie = withPartnerSession();
    completeMock.mockResolvedValueOnce({ id: "booking-1", status: "COMPLETED" });

    const res = await request(app).patch("/api/bookings/partner/booking-1/complete").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "booking-1", status: "COMPLETED" });
    expect(completeMock).toHaveBeenCalledWith("booking-1", "partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/bookings/partner/booking-1/complete");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — la réservation à compléter n'existe pas", async () => {
    const cookie = withPartnerSession();
    completeMock.mockRejectedValueOnce(new AppError("Réservation introuvable", 404));

    const res = await request(app).patch("/api/bookings/partner/booking-inconnue/complete").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Réservation introuvable" });
  });

  it("403 — refuse de compléter une réservation appartenant à un autre partenaire", async () => {
    const cookie = withPartnerSession();
    completeMock.mockRejectedValueOnce(new AppError("Accès interdit", 403));

    const res = await request(app).patch("/api/bookings/partner/booking-dun-autre-partenaire/complete").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "Accès interdit" });
  });

  it("400 — refuse de compléter une réservation qui n'est pas CONFIRMED", async () => {
    const cookie = withPartnerSession();
    completeMock.mockRejectedValueOnce(new AppError("Seule une réservation CONFIRMED peut être complétée", 400));

    const res = await request(app).patch("/api/bookings/partner/booking-1/complete").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Seule une réservation CONFIRMED peut être complétée" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    completeMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/bookings/partner/booking-1/complete").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /admin/all — authorize(SUPER_ADMIN, PLATFORM_MANAGER) — RBAC classique ──
describe("GET /api/bookings/admin/all", () => {
  it("200 — un SUPER_ADMIN reçoit la liste filtrée de toutes les réservations", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    getAllForAdminMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 50 });

    const res = await request(app).get("/api/bookings/admin/all?status=CONFIRMED").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getAllForAdminMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "CONFIRMED", page: 1, limit: 50 })
    );
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/bookings/admin/all");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE) — RBAC, pas isolation métier", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/bookings/admin/all").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" }); // pas de `success:false` ici (authorize(), pas AppError)
    expect(getAllForAdminMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    getAllForAdminMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/bookings/admin/all").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
