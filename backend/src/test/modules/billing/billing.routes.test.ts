// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/billing (src/modules/billing).
//
// Particularité : le contrôleur importe aussi `PLAN_PRICES_USD`/`PLAN_PRICES_XOF`
// (constantes réelles, pas des méthodes de service) depuis billing.service.ts,
// utilisées pour valider le plan demandé (`isValidPlan`) et pour GET /plans.
// Un automock complet du module aurait aussi neutralisé ces constantes —
// on mocke donc SEULEMENT la classe `BillingService`, en gardant le reste du
// module réel via `jest.requireActual`, pour que ces vérifications continuent
// de fonctionner avec les vraies valeurs (STARTER, BUSINESS, ENTERPRISE).
//
// Pas de validation Zod dans ce contrôleur : vérifications manuelles (plan
// valide, transactionId non vide). Style "code fixe manuel" (400 sur toute
// erreur métier).
//
// RBAC : /webhook/* et /plans sont publics (déclarés avant `authenticate`) ;
// le reste du routeur exige authorize(SUPER_ADMIN, ADMIN, FINANCE).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

const mockBillingServiceMethods = {
  getSubscription: jest.fn(),
  upgradePlan: jest.fn(),
  getInvoices: jest.fn(),
  processKkiapayPayment: jest.fn(),
  initiateFedapayPayment: jest.fn(),
  processCardPayment: jest.fn(),
  handleKkiapayWebhook: jest.fn(),
  handleFedapayWebhook: jest.fn(),
};

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/billing/application/billing.service", () => {
  const actual = jest.requireActual("../../../modules/billing/application/billing.service");
  return {
    ...actual,
    BillingService: jest.fn().mockImplementation(() => mockBillingServiceMethods),
  };
});

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
  Object.values(mockBillingServiceMethods).forEach((fn) => fn.mockReset());
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

describe("POST /api/billing/webhook/kkiapay (public)", () => {
  it("200 — confirme un paiement KkiaPay valide", async () => {
    mockBillingServiceMethods.handleKkiapayWebhook.mockResolvedValueOnce({ confirmed: true });

    const res = await request(app).post("/api/billing/webhook/kkiapay").send({ transactionId: "txn-1" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ confirmed: true });
  });

  it("400 — rejette une signature invalide", async () => {
    mockBillingServiceMethods.handleKkiapayWebhook.mockRejectedValueOnce(new Error("Signature invalide"));

    const res = await request(app).post("/api/billing/webhook/kkiapay").send({ transactionId: "txn-1" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Signature invalide" });
  });
});

describe("POST /api/billing/webhook/fedapay (public)", () => {
  it("200 — confirme un paiement FedaPay valide", async () => {
    mockBillingServiceMethods.handleFedapayWebhook.mockResolvedValueOnce({ confirmed: true });

    const res = await request(app).post("/api/billing/webhook/fedapay").send({ event: "transaction.approved" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ confirmed: true });
  });

  it("400 — rejette un token invalide", async () => {
    mockBillingServiceMethods.handleFedapayWebhook.mockRejectedValueOnce(new Error("Token invalide"));

    const res = await request(app).post("/api/billing/webhook/fedapay").send({ event: "transaction.approved" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Token invalide" });
  });
});

describe("GET /api/billing/plans (public)", () => {
  it("200 — retourne les prix réels des plans, sans authentification", async () => {
    const res = await request(app).get("/api/billing/plans");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { plan: "STARTER", priceUSD: 0, priceXOF: 0 },
      { plan: "BUSINESS", priceUSD: 299, priceXOF: 175000 },
      { plan: "ENTERPRISE", priceUSD: 499, priceXOF: 292000 },
    ]);
  });
});

describe("GET /api/billing", () => {
  it("200 — retourne l'abonnement courant de l'organisation", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.getSubscription.mockResolvedValueOnce({ plan: "BUSINESS", status: "ACTIVE" });

    const res = await request(app).get("/api/billing").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ plan: "BUSINESS", status: "ACTIVE" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/billing");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/billing").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(mockBillingServiceMethods.getSubscription).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.getSubscription.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/billing").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/billing/upgrade", () => {
  it("200 — change de plan sans paiement immédiat", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.upgradePlan.mockResolvedValueOnce({ plan: "BUSINESS" });

    const res = await request(app).post("/api/billing/upgrade").set("Cookie", cookie).send({ plan: "BUSINESS" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ plan: "BUSINESS" });
  });

  it("400 — rejette un plan invalide (vérification manuelle, pas Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/billing/upgrade").set("Cookie", cookie).send({ plan: "PREMIUM" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Plan invalide" });
    expect(mockBillingServiceMethods.upgradePlan).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du service", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.upgradePlan.mockRejectedValueOnce(new Error("Downgrade impossible avec des utilisateurs actifs excédentaires"));

    const res = await request(app).post("/api/billing/upgrade").set("Cookie", cookie).send({ plan: "STARTER" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Downgrade impossible avec des utilisateurs actifs excédentaires" });
  });
});

describe("GET /api/billing/invoices", () => {
  it("200 — retourne l'historique des factures", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.getInvoices.mockResolvedValueOnce([{ id: "inv-1", amount: 175000 }]);

    const res = await request(app).get("/api/billing/invoices").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "inv-1", amount: 175000 }]);
  });
});

describe("POST /api/billing/pay/kkiapay", () => {
  it("200 — vérifie et confirme un paiement KkiaPay", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.processKkiapayPayment.mockResolvedValueOnce({ orgId: "org-1", plan: "BUSINESS" });

    const res = await request(app)
      .post("/api/billing/pay/kkiapay")
      .set("Cookie", cookie)
      .send({ plan: "BUSINESS", transactionId: "txn-1" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: "Paiement KkiaPay confirmé", orgId: "org-1", plan: "BUSINESS" });
  });

  it("400 — rejette un plan invalide", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/billing/pay/kkiapay")
      .set("Cookie", cookie)
      .send({ plan: "PREMIUM", transactionId: "txn-1" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Plan invalide" });
  });

  it("400 — rejette un transactionId manquant", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/billing/pay/kkiapay").set("Cookie", cookie).send({ plan: "BUSINESS" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "transactionId requis" });
    expect(mockBillingServiceMethods.processKkiapayPayment).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (transaction KkiaPay invalide)", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.processKkiapayPayment.mockRejectedValueOnce(new Error("Transaction KkiaPay invalide ou non complétée"));

    const res = await request(app)
      .post("/api/billing/pay/kkiapay")
      .set("Cookie", cookie)
      .send({ plan: "BUSINESS", transactionId: "txn-invalide" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Transaction KkiaPay invalide ou non complétée" });
  });
});

describe("POST /api/billing/pay/fedapay", () => {
  it("200 — initie une transaction FedaPay et retourne l'URL de paiement", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.initiateFedapayPayment.mockResolvedValueOnce({ checkoutUrl: "https://fedapay.com/checkout/xyz" });

    const res = await request(app).post("/api/billing/pay/fedapay").set("Cookie", cookie).send({ plan: "BUSINESS" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ checkoutUrl: "https://fedapay.com/checkout/xyz" });
  });

  it("400 — rejette un plan invalide", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/billing/pay/fedapay").set("Cookie", cookie).send({ plan: "PREMIUM" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Plan invalide" });
  });

  it("400 — propage une erreur métier (FedaPay indisponible)", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.initiateFedapayPayment.mockRejectedValueOnce(new Error("FEDAPAY_SECRET_KEY manquant"));

    const res = await request(app).post("/api/billing/pay/fedapay").set("Cookie", cookie).send({ plan: "BUSINESS" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "FEDAPAY_SECRET_KEY manquant" });
  });
});

describe("POST /api/billing/pay/card", () => {
  it("200 — traite un paiement par carte", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.processCardPayment.mockResolvedValueOnce({ status: "PAID" });

    const res = await request(app)
      .post("/api/billing/pay/card")
      .set("Cookie", cookie)
      .send({ plan: "BUSINESS", cardNumber: "4242424242424242", expiry: "12/28", cvv: "123" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, status: "PAID" });
  });

  it("400 — rejette un plan invalide", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/billing/pay/card").set("Cookie", cookie).send({ plan: "PREMIUM" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Plan invalide" });
  });

  it("400 — propage une erreur métier (carte refusée)", async () => {
    const cookie = withSession();
    mockBillingServiceMethods.processCardPayment.mockRejectedValueOnce(new Error("Carte refusée"));

    const res = await request(app)
      .post("/api/billing/pay/card")
      .set("Cookie", cookie)
      .send({ plan: "BUSINESS", cardNumber: "0000000000000000", expiry: "01/20", cvv: "000" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Carte refusée" });
  });
});
