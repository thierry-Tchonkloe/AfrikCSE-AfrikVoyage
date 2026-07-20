// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/orders (src/modules/orders).
//
// Stratégie d'isolation (identique au module auth) :
// - `core/config/prisma` → mocké : utilisé par `authenticate`.
// - `core/utils/jwt` → mocké : contrôle le payload décodé du cookie de session.
// - `modules/orders/application/order.service` → mocké (automock) : isole le
//   routing/validation/authorize/contrôleur de la logique métier réelle
//   (wallet, cashback, règles de subvention, paiement marketplace…).
// - `core/services/marketplace-payment.service` → mocké (automock) : contrôle
//   la vérification de signature/token des webhooks de paiement (routes
//   publiques, sans JWT).
//
// Contrairement à `auth`, ce module utilise `authorize()` sur GET /admin/all
// (SUPER_ADMIN, PLATFORM_MANAGER) → cas 403 testé explicitement.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/orders/application/order.service");
jest.mock("../../../core/services/marketplace-payment.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { OrderService } from "../../../modules/orders/application/order.service";
import { MarketplacePaymentService } from "../../../core/services/marketplace-payment.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

// Instances singleton créées au chargement de order.controller.ts — en automock,
// les méthodes du prototype sont partagées par toute instance `new XxxService()`.
const createMock = OrderService.prototype.create as jest.Mock;
const getMyOrdersMock = OrderService.prototype.getMyOrders as jest.Mock;
const getOrderByIdMock = OrderService.prototype.getOrderById as jest.Mock;
const cancelOrderMock = OrderService.prototype.cancelOrder as jest.Mock;
const getAllForAdminMock = OrderService.prototype.getAllForAdmin as jest.Mock;
const confirmFromWebhookMock = OrderService.prototype.confirmFromWebhook as jest.Mock;

const verifyKkiapaySignatureMock =
  MarketplacePaymentService.prototype.verifyKkiapayWebhookSignature as jest.Mock;
const verifyFedapayTokenMock =
  MarketplacePaymentService.prototype.verifyFedapayWebhookToken as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

const validOrderBody = {
  amount: 5000,
  paymentMethod: "WALLET",
  idempotencyKey: "idem-key-12345",
};

// ── Webhooks publics (pas d'authenticate) ────────────────────────────────────
describe("POST /api/orders/webhook/kkiapay", () => {
  const validEvent = { eventType: "SUCCESSFUL_PAYMENT", transactionId: "txn-1", amount: 5000 };

  it("401 — rejette une signature HMAC invalide", async () => {
    verifyKkiapaySignatureMock.mockReturnValueOnce(false);

    const res = await request(app)
      .post("/api/orders/webhook/kkiapay")
      .set("x-kkiapay-signature", "signature-invalide")
      .send(validEvent);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Signature invalide" });
    expect(confirmFromWebhookMock).not.toHaveBeenCalled();
  });

  it("200 — ignore un événement dont le type n'est pas SUCCESSFUL_PAYMENT", async () => {
    verifyKkiapaySignatureMock.mockReturnValueOnce(true);

    const res = await request(app)
      .post("/api/orders/webhook/kkiapay")
      .set("x-kkiapay-signature", "signature-valide")
      .send({ ...validEvent, eventType: "FAILED_PAYMENT" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ignored: true });
    expect(confirmFromWebhookMock).not.toHaveBeenCalled();
  });

  it("200 — confirme la commande sur un paiement réussi avec signature valide", async () => {
    verifyKkiapaySignatureMock.mockReturnValueOnce(true);
    confirmFromWebhookMock.mockResolvedValueOnce({ confirmed: true, orderId: "order-1" });

    const res = await request(app)
      .post("/api/orders/webhook/kkiapay")
      .set("x-kkiapay-signature", "signature-valide")
      .send(validEvent);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ confirmed: true, orderId: "order-1" });
    expect(confirmFromWebhookMock).toHaveBeenCalledWith("txn-1");
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    verifyKkiapaySignatureMock.mockReturnValueOnce(true);
    confirmFromWebhookMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .post("/api/orders/webhook/kkiapay")
      .set("x-kkiapay-signature", "signature-valide")
      .send(validEvent);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/orders/webhook/fedapay", () => {
  const validEvent = {
    id: "evt-1",
    name: "transaction.approved",
    data: { object: { id: 987654321, reference: "ref-1", status: "approved", amount: 5000 } },
  };

  it("401 — rejette un token Bearer invalide", async () => {
    verifyFedapayTokenMock.mockReturnValueOnce(false);

    const res = await request(app)
      .post("/api/orders/webhook/fedapay")
      .set("Authorization", "Bearer token-invalide")
      .send(validEvent);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token invalide" });
    expect(confirmFromWebhookMock).not.toHaveBeenCalled();
  });

  it("200 — ignore un événement différent de transaction.approved", async () => {
    verifyFedapayTokenMock.mockReturnValueOnce(true);

    const res = await request(app)
      .post("/api/orders/webhook/fedapay")
      .set("Authorization", "Bearer token-valide")
      .send({ ...validEvent, name: "transaction.declined" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ignored: true, event: "transaction.declined" });
    expect(confirmFromWebhookMock).not.toHaveBeenCalled();
  });

  it("200 — confirme la commande sur transaction.approved avec token valide", async () => {
    verifyFedapayTokenMock.mockReturnValueOnce(true);
    confirmFromWebhookMock.mockResolvedValueOnce({ confirmed: true, orderId: "order-2" });

    const res = await request(app)
      .post("/api/orders/webhook/fedapay")
      .set("Authorization", "Bearer token-valide")
      .send(validEvent);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ confirmed: true, orderId: "order-2" });
    expect(confirmFromWebhookMock).toHaveBeenCalledWith("987654321");
  });
});

// ── GET /admin/all — protégé par authorize(SUPER_ADMIN, PLATFORM_MANAGER) ───
describe("GET /api/orders/admin/all", () => {
  it("200 — un SUPER_ADMIN reçoit la liste paginée de toutes les commandes", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    getAllForAdminMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 50 });

    const res = await request(app).get("/api/orders/admin/all").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 50 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/orders/admin/all");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(getAllForAdminMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/orders/admin/all").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getAllForAdminMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    getAllForAdminMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/orders/admin/all").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST / — création de commande ────────────────────────────────────────────
describe("POST /api/orders", () => {
  it("201 — crée une commande avec un corps valide", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "order-1", status: "CONFIRMED", finalAmount: 5000 });

    const res = await request(app).post("/api/orders").set("Cookie", cookie).send(validOrderBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "order-1", status: "CONFIRMED", finalAmount: 5000 });
    expect(createMock).toHaveBeenCalledWith("user-1", "org-1", expect.objectContaining(validOrderBody));
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/orders").send(validOrderBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).post("/api/orders").set("Cookie", cookie).send(validOrderBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un corps invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/orders").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.amount).toBeDefined();
    expect(res.body.errors.fieldErrors.paymentMethod).toBeDefined();
    expect(res.body.errors.fieldErrors.idempotencyKey).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (montant final négatif)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new AppError("Le montant final ne peut pas être négatif", 400));

    const res = await request(app).post("/api/orders").set("Cookie", cookie).send(validOrderBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Le montant final ne peut pas être négatif" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/orders").set("Cookie", cookie).send(validOrderBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET / — mes commandes ────────────────────────────────────────────────────
describe("GET /api/orders", () => {
  it("200 — retourne mes commandes paginées", async () => {
    const cookie = withSession();
    getMyOrdersMock.mockResolvedValueOnce({ data: [{ id: "order-1" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/orders").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(getMyOrdersMock).toHaveBeenCalledWith("user-1", "org-1", 1, 20);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/orders");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/orders").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getMyOrdersMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/orders").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /:id — détail d'une commande ─────────────────────────────────────────
describe("GET /api/orders/:id", () => {
  it("200 — retourne la commande demandée", async () => {
    const cookie = withSession();
    getOrderByIdMock.mockResolvedValueOnce({ id: "order-1", status: "CONFIRMED" });

    const res = await request(app).get("/api/orders/order-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "order-1", status: "CONFIRMED" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/orders/order-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("404 — la commande n'existe pas ou n'appartient pas à l'utilisateur", async () => {
    const cookie = withSession();
    getOrderByIdMock.mockRejectedValueOnce(new AppError("Commande introuvable", 404));

    const res = await request(app).get("/api/orders/order-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Commande introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getOrderByIdMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/orders/order-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── DELETE /:id — annulation d'une commande ──────────────────────────────────
describe("DELETE /api/orders/:id", () => {
  it("200 — annule la commande demandée", async () => {
    const cookie = withSession();
    cancelOrderMock.mockResolvedValueOnce({ id: "order-1", status: "CANCELLED" });

    const res = await request(app).delete("/api/orders/order-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "order-1", status: "CANCELLED" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).delete("/api/orders/order-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).delete("/api/orders/order-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(cancelOrderMock).not.toHaveBeenCalled();
  });

  it("404 — la commande à annuler n'existe pas", async () => {
    const cookie = withSession();
    cancelOrderMock.mockRejectedValueOnce(new AppError("Commande introuvable", 404));

    const res = await request(app).delete("/api/orders/order-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Commande introuvable" });
  });

  it("400 — refuse d'annuler une commande déjà complétée", async () => {
    const cookie = withSession();
    cancelOrderMock.mockRejectedValueOnce(
      new AppError("Une commande complétée ne peut pas être annulée", 400)
    );

    const res = await request(app).delete("/api/orders/order-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Une commande complétée ne peut pas être annulée",
    });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    cancelOrderMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).delete("/api/orders/order-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
