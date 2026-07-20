// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/employees (src/modules/employees).
// Vue RH globale — distincte de /api/employee (espace personnel employé).
//
// Une seule config RBAC pour tout le routeur (SUPER_ADMIN, ADMIN, MANAGER, RH)
// → 401/403 testés une seule fois, sur GET / (voir organization.routes.test.ts
// pour la même logique d'économie appliquée plus largement).
// getAll/getStats n'ont aucun try/catch (→ errorMiddleware global en cas
// d'erreur) ; getById catche manuellement → 404 { message } (style `auth`/
// `user`/`organization`, pas de `success:false`).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/employees/application/employee.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { EmployeeService } from "../../../modules/employees/application/employee.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllMock = EmployeeService.prototype.getAll as jest.Mock;
const getStatsMock = EmployeeService.prototype.getStats as jest.Mock;
const getByIdMock = EmployeeService.prototype.getById as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "RH", organizationId: "org-1", ...overrides });
}

// ── GET / — représentative du RBAC du module ─────────────────────────────────
describe("GET /api/employees", () => {
  it("200 — un RH reçoit la liste des employés de son organisation", async () => {
    const cookie = withSession();
    getAllMock.mockResolvedValueOnce({ data: [{ id: "emp-1" }], total: 1, page: 1, limit: 10 });

    const res = await request(app).get("/api/employees").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/employees");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/employees").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getAllMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getAllMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employees").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /stats — même RBAC, 401/403 non répétés ──────────────────────────────
describe("GET /api/employees/stats", () => {
  it("200 — retourne les statistiques RH de l'organisation", async () => {
    const cookie = withSession();
    getStatsMock.mockResolvedValueOnce({ total: 42, active: 40 });

    const res = await request(app).get("/api/employees/stats").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 42, active: 40 });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getStatsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/employees/stats").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /:id — même RBAC, 401/403 non répétés ────────────────────────────────
describe("GET /api/employees/:id", () => {
  it("200 — retourne le détail d'un employé", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "emp-1", firstName: "Awa" });

    const res = await request(app).get("/api/employees/emp-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "emp-1", firstName: "Awa" });
  });

  it("404 — employé introuvable (catch manuel, toujours 404)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Employé introuvable"));

    const res = await request(app).get("/api/employees/emp-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Employé introuvable" });
  });
});
