// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/wallet (src/modules/wallet).
//
// Stratégie d'isolation (identique aux modules auth/orders/cashback) :
// - `core/config/prisma` → mocké : utilisé par `authenticate`.
// - `core/utils/jwt` → mocké : contrôle le payload décodé du cookie de session.
// - `modules/wallet/application/wallet.service` → mocké (automock) : isole le
//   routing/validation/authorize/contrôleur du grand livre réel (ledger).
// - `session-helpers.ts` (mockAuthenticatedSession) réutilisé tel quel.
//
// ⚠️ Périmètre réel du module (vérifié dans wallet.routes.ts) : seules 4 routes
// existent aujourd'hui — GET /, GET /entries, POST /allocate, GET /admin/org.
// Il n'y a PAS de route de retrait/payout, de rechargement, ni de champ
// numéro MoMo/Flooz dans ce module : `WalletService.debitForOrder` (débit)
// est un débit interne déclenché par /api/orders (déjà couvert dans
// orders.routes.test.ts), pas un endpoint wallet direct. Le seul flux
// "employé → admin" existant est `allocate` (crédit d'un budget par un admin),
// pas un retrait initié par l'employé. Voir le message de fin de tâche pour
// le détail de cet écart avec les instructions initiales.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/wallet/application/wallet.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { WalletService } from "../../../modules/wallet/application/wallet.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

// Instance singleton créée au chargement de wallet.controller.ts — en automock,
// les méthodes du prototype sont partagées par toute instance `new WalletService()`.
const getMyWalletMock = WalletService.prototype.getMyWallet as jest.Mock;
const getMyEntriesMock = WalletService.prototype.getMyEntries as jest.Mock;
const allocateMock = WalletService.prototype.allocate as jest.Mock;
const getOrgWalletsMock = WalletService.prototype.getOrgWallets as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

const validAllocateBody = {
  userIds: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  amount: 10000,
  period: "2026-07",
  description: "Allocation rentrée scolaire",
};

// ── GET / — mon wallet (authenticate seul) ───────────────────────────────────
describe("GET /api/wallet", () => {
  it("200 — retourne le wallet et le solde de l'utilisateur", async () => {
    const cookie = withSession();
    getMyWalletMock.mockResolvedValueOnce({ wallet: { id: "wallet-1" }, balance: 15000 });

    const res = await request(app).get("/api/wallet").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ wallet: { id: "wallet-1" }, balance: 15000 });
    expect(getMyWalletMock).toHaveBeenCalledWith("user-1", "org-1");
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/wallet").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(getMyWalletMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/wallet");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(getMyWalletMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getMyWalletMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/wallet").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /entries — historique du ledger de l'employé ─────────────────────────
describe("GET /api/wallet/entries", () => {
  it("200 — retourne l'historique paginé des mouvements", async () => {
    const cookie = withSession();
    getMyEntriesMock.mockResolvedValueOnce({ data: [{ id: "entry-1" }], total: 1, page: 2, limit: 10 });

    const res = await request(app).get("/api/wallet/entries?page=2&limit=10").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(getMyEntriesMock).toHaveBeenCalledWith("user-1", "org-1", 2, 10);
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/wallet/entries").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(getMyEntriesMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/wallet/entries");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getMyEntriesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/wallet/entries").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /allocate — authorize(ADMIN, FINANCE, SUPER_ADMIN) ─────────────────
describe("POST /api/wallet/allocate", () => {
  it("200 — alloue un budget aux salariés listés", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });
    allocateMock.mockResolvedValueOnce({ succeeded: 1, failed: 0, total: 1 });

    const res = await request(app).post("/api/wallet/allocate").set("Cookie", cookie).send(validAllocateBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ succeeded: 1, failed: 0, total: 1 });
    expect(allocateMock).toHaveBeenCalledTimes(1);
    const callArgs = allocateMock.mock.calls[0];
    expect(callArgs[0]).toBe("org-1");
    expect(callArgs[1]).toEqual(validAllocateBody.userIds);
    expect(String(callArgs[2])).toBe("10000"); // Prisma.Decimal(amount) sérialisé
    expect(callArgs[3]).toBe("2026-07");
    expect(callArgs[4]).toBe("Allocation rentrée scolaire");
    expect(callArgs[5]).toBeUndefined();
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: null });

    const res = await request(app).post("/api/wallet/allocate").set("Cookie", cookie).send(validAllocateBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(allocateMock).not.toHaveBeenCalled();
  });

  it("400 — rejette une liste de salariés vide (validation Zod)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .post("/api/wallet/allocate")
      .set("Cookie", cookie)
      .send({ ...validAllocateBody, userIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.userIds).toBeDefined();
    expect(allocateMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un montant négatif ou nul (validation Zod)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .post("/api/wallet/allocate")
      .set("Cookie", cookie)
      .send({ ...validAllocateBody, amount: -500 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.amount).toBeDefined();
    expect(allocateMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un id de salarié qui n'est pas un uuid valide (validation Zod)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .post("/api/wallet/allocate")
      .set("Cookie", cookie)
      .send({ ...validAllocateBody, userIds: ["pas-un-uuid"] });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.userIds).toBeDefined();
    expect(allocateMock).not.toHaveBeenCalled();
  });

  it("400 — rejette une période manquante (validation Zod)", async () => {
    const cookie = withSession({ role: "ADMIN" });
    const { period: _period, ...bodyWithoutPeriod } = validAllocateBody;

    const res = await request(app).post("/api/wallet/allocate").set("Cookie", cookie).send(bodyWithoutPeriod);

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.period).toBeDefined();
    expect(allocateMock).not.toHaveBeenCalled();
  });

  it("400 — propage la règle métier de défense en profondeur (montant non positif)", async () => {
    // Le schéma Zod bloque déjà les montants <= 0 en amont, mais le service
    // revalide (défense en profondeur) — on simule ce chemin explicitement.
    const cookie = withSession({ role: "ADMIN" });
    allocateMock.mockRejectedValueOnce(new AppError("Le montant d'allocation doit être positif", 400));

    const res = await request(app).post("/api/wallet/allocate").set("Cookie", cookie).send(validAllocateBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Le montant d'allocation doit être positif" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/wallet/allocate").send(validAllocateBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).post("/api/wallet/allocate").set("Cookie", cookie).send(validAllocateBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(allocateMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "FINANCE" });
    allocateMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/wallet/allocate").set("Cookie", cookie).send(validAllocateBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /admin/org — authorize(ADMIN, FINANCE, MANAGER, SUPER_ADMIN) ────────
describe("GET /api/wallet/admin/org", () => {
  it("200 — un MANAGER reçoit les wallets de toute l'organisation", async () => {
    const cookie = withSession({ role: "MANAGER", organizationId: "org-1" });
    getOrgWalletsMock.mockResolvedValueOnce([{ id: "wallet-1", balance: 5000 }]);

    const res = await request(app).get("/api/wallet/admin/org").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "wallet-1", balance: 5000 }]);
    expect(getOrgWalletsMock).toHaveBeenCalledWith("org-1");
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: null });

    const res = await request(app).get("/api/wallet/admin/org").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
    expect(getOrgWalletsMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/wallet/admin/org");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/wallet/admin/org").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getOrgWalletsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    getOrgWalletsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/wallet/admin/org").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
