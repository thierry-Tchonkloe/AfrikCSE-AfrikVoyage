// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/audit-logs (src/modules/audit-log).
// Aucun try/catch dans ce contrôleur → toute erreur remonte au middleware
// d'erreurs global. Une seule config RBAC (SUPER_ADMIN seul) → 401/403
// testés une fois, sur GET /.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/audit-log/application/audit-log.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { AuditLogService } from "../../../modules/audit-log/application/audit-log.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getPaginatedMock = AuditLogService.prototype.getPaginated as jest.Mock;
const getDistinctActionsMock = AuditLogService.prototype.getDistinctActions as jest.Mock;
const getAllForExportMock = AuditLogService.prototype.getAllForExport as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

describe("GET /api/audit-logs", () => {
  it("200 — retourne le journal d'audit paginé", async () => {
    const cookie = withSession();
    getPaginatedMock.mockResolvedValueOnce({ data: [{ id: "log-1", action: "USER_LOGIN" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/audit-logs?action=USER_LOGIN").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/audit-logs");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/audit-logs").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getPaginatedMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getPaginatedMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/audit-logs").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/audit-logs/actions", () => {
  it("200 — retourne les types d'actions distincts", async () => {
    const cookie = withSession();
    getDistinctActionsMock.mockResolvedValueOnce(["USER_LOGIN", "ORG_VALIDATED"]);

    const res = await request(app).get("/api/audit-logs/actions").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["USER_LOGIN", "ORG_VALIDATED"]);
  });
});

describe("GET /api/audit-logs/export", () => {
  it("200 — retourne un export CSV du journal d'audit", async () => {
    const cookie = withSession();
    getAllForExportMock.mockResolvedValueOnce([
      {
        createdAt: new Date("2026-01-15T10:30:00.000Z"),
        action: "USER_LOGIN", entity: "User", entityId: "user-1",
        user: { firstName: "Jean", lastName: "Dupont", email: "jean@acme.com" },
        organization: { name: "Acme" },
        ipAddress: "127.0.0.1",
      },
    ]);

    const res = await request(app).get("/api/audit-logs/export").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("USER_LOGIN");
  });
});
