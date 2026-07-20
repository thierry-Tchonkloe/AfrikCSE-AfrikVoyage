// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/settings (src/modules/settings).
//
// ⚠️ Style d'erreur différent des modules récents (orders/cashback/wallet/
// bookings/partner-portal) : SettingsController n'utilise PAS `next(err)` +
// `AppError` + `errorMiddleware`. `update()` catche manuellement et répond
// `{ message: err.message }` (PAS de `success:false`) avec un code 400 fixe,
// quel que soit le type d'erreur. `get()`/`getDashboard()` n'ont AUCUN
// try/catch : une erreur du service y remonte donc bien au middleware global
// (→ 500 générique standard), C'EST le seul cas où `errorMiddleware` entre en
// jeu dans ce module. Ce style (identique à `auth` et aux autres modules de ce
// sprint : `organization`, `user`) semble être le pattern d'origine du projet,
// avant l'introduction d'`AppError`/`errorMiddleware` sur les modules plus
// récents (orders, cashback, wallet, bookings, partner-portal).
//
// Toutes les routes partagent la même config RBAC (`authenticate` +
// `authorize("SUPER_ADMIN")`) — le 401/403 est donc testé une seule fois, sur
// la route représentative GET /, plutôt que répété sur les 3 routes.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/settings/application/settings.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { SettingsService } from "../../../modules/settings/application/settings.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getMock = SettingsService.prototype.get as jest.Mock;
const updateMock = SettingsService.prototype.update as jest.Mock;
const getDashboardDataMock = SettingsService.prototype.getDashboardData as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

// ── GET / (route représentative pour le RBAC de tout le module) ─────────────
describe("GET /api/settings", () => {
  it("200 — un SUPER_ADMIN reçoit les réglages de la plateforme", async () => {
    const cookie = withSession();
    getMock.mockResolvedValueOnce({ primaryColor: "#0f766e", darkModeEnabled: false });

    const res = await request(app).get("/api/settings").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ primaryColor: "#0f766e", darkModeEnabled: false });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/settings");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(getMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN — seul SUPER_ADMIN a accès à ce module)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/settings").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global (aucun try/catch sur cette route)", async () => {
    const cookie = withSession();
    getMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/settings").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH / ───────────────────────────────────────────────────────────────
describe("PATCH /api/settings", () => {
  it("200 — met à jour les réglages avec un corps valide", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ primaryColor: "#123456" });

    const res = await request(app).patch("/api/settings").set("Cookie", cookie).send({ primaryColor: "#123456" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ primaryColor: "#123456" });
  });

  it("400 — rejette une couleur au format invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/settings").set("Cookie", cookie).send({ primaryColor: "bleu" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.primaryColor).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du service (catch manuel, pas de success:false)", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new Error("Échec de la mise à jour"));

    const res = await request(app).patch("/api/settings").set("Cookie", cookie).send({ darkModeEnabled: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Échec de la mise à jour" });
  });
});

// ── GET /dashboard ────────────────────────────────────────────────────────
describe("GET /api/settings/dashboard", () => {
  it("200 — retourne les statistiques du tableau de bord SUPER_ADMIN", async () => {
    const cookie = withSession();
    getDashboardDataMock.mockResolvedValueOnce({ stats: {}, recent: [], monthly: [] });

    const res = await request(app).get("/api/settings/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ stats: {}, recent: [], monthly: [] });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getDashboardDataMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/settings/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
