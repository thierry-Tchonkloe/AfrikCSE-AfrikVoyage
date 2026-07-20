// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/reporting (src/modules/reporting).
// Repository-direct (ReportingRepository, mocké), style `next(err)` +
// errorMiddleware global.
//
// RBAC — 3 configurations distinctes :
//   (a) SUPER_ADMIN, PLATFORM_MANAGER                    → /platform/*
//   (b) SUPER_ADMIN, ADMIN, MANAGER, RH, FINANCE          → /org/kpis
//   (c) SUPER_ADMIN, ADMIN, MANAGER                       → /org/bookings/trend
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/reporting/infrastructure/reporting.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { ReportingRepository } from "../../../modules/reporting/infrastructure/reporting.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getPlatformKpisMock = ReportingRepository.prototype.getPlatformKpis as jest.Mock;
const getBookingsByStatusMock = ReportingRepository.prototype.getBookingsByStatus as jest.Mock;
const getBookingsPerMonthMock = ReportingRepository.prototype.getBookingsPerMonth as jest.Mock;
const getOrdersPerMonthMock = ReportingRepository.prototype.getOrdersPerMonth as jest.Mock;
const getTopPartnersMock = ReportingRepository.prototype.getTopPartners as jest.Mock;
const getCommissionSummaryMock = ReportingRepository.prototype.getCommissionSummary as jest.Mock;
const getOrgKpisMock = ReportingRepository.prototype.getOrgKpis as jest.Mock;
const getOrgBookingsPerMonthMock = ReportingRepository.prototype.getOrgBookingsPerMonth as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", organizationId: "org-1", ...overrides });
}

describe("GET /api/reporting/platform/kpis", () => {
  it("200 — un SUPER_ADMIN reçoit les KPIs de la plateforme", async () => {
    const cookie = withSession();
    getPlatformKpisMock.mockResolvedValueOnce({ totalOrgs: 42, activeUsers: 1200 });

    const res = await request(app).get("/api/reporting/platform/kpis").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalOrgs: 42, activeUsers: 1200 });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/reporting/platform/kpis");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/reporting/platform/kpis").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getPlatformKpisMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du repository au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getPlatformKpisMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/reporting/platform/kpis").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/reporting/platform/bookings/status", () => {
  it("200 — retourne la répartition des réservations par statut", async () => {
    const cookie = withSession();
    getBookingsByStatusMock.mockResolvedValueOnce({ PENDING: 5, CONFIRMED: 20 });

    const res = await request(app).get("/api/reporting/platform/bookings/status").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ PENDING: 5, CONFIRMED: 20 });
  });
});

describe("GET /api/reporting/platform/bookings/trend", () => {
  it("200 — retourne la tendance des réservations sur N mois", async () => {
    const cookie = withSession();
    getBookingsPerMonthMock.mockResolvedValueOnce([{ month: "2026-06", count: 10 }]);

    const res = await request(app).get("/api/reporting/platform/bookings/trend?months=3").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getBookingsPerMonthMock).toHaveBeenCalledWith(3);
  });
});

describe("GET /api/reporting/platform/orders/trend", () => {
  it("200 — retourne la tendance des commandes sur N mois", async () => {
    const cookie = withSession();
    getOrdersPerMonthMock.mockResolvedValueOnce([{ month: "2026-06", count: 30 }]);

    const res = await request(app).get("/api/reporting/platform/orders/trend").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getOrdersPerMonthMock).toHaveBeenCalledWith(6);
  });
});

describe("GET /api/reporting/platform/partners/top", () => {
  it("200 — retourne le classement des meilleurs partenaires", async () => {
    const cookie = withSession();
    getTopPartnersMock.mockResolvedValueOnce([{ id: "partner-1", revenue: 500000 }]);

    const res = await request(app).get("/api/reporting/platform/partners/top").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getTopPartnersMock).toHaveBeenCalledWith(10);
  });
});

describe("GET /api/reporting/platform/commissions", () => {
  it("200 — retourne le résumé des commissions", async () => {
    const cookie = withSession();
    getCommissionSummaryMock.mockResolvedValueOnce({ totalPending: 100000, totalPaid: 500000 });

    const res = await request(app).get("/api/reporting/platform/commissions").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalPending: 100000, totalPaid: 500000 });
  });
});

describe("GET /api/reporting/org/kpis", () => {
  it("200 — un FINANCE reçoit les KPIs de son organisation", async () => {
    const cookie = withSession({ role: "FINANCE" });
    getOrgKpisMock.mockResolvedValueOnce({ totalSpent: 300000 });

    const res = await request(app).get("/api/reporting/org/kpis").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ totalSpent: 300000 });
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/reporting/org/kpis").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/reporting/org/kpis");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/reporting/org/kpis").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getOrgKpisMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/reporting/org/bookings/trend", () => {
  it("200 — un MANAGER reçoit la tendance des réservations de son organisation", async () => {
    const cookie = withSession({ role: "MANAGER" });
    getOrgBookingsPerMonthMock.mockResolvedValueOnce([{ month: "2026-06", count: 4 }]);

    const res = await request(app).get("/api/reporting/org/bookings/trend").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getOrgBookingsPerMonthMock).toHaveBeenCalledWith("org-1", 6);
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/reporting/org/bookings/trend").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
  });

  it("403 — refuse l'accès à un FINANCE (autorisé sur /org/kpis mais pas ici)", async () => {
    const cookie = withSession({ role: "FINANCE" });

    const res = await request(app).get("/api/reporting/org/bookings/trend").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getOrgBookingsPerMonthMock).not.toHaveBeenCalled();
  });
});
