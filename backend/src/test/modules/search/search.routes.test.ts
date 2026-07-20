// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/search (src/modules/search).
// Une seule route (GET /), mais une logique de branchement riche : le
// contrôleur fait lui-même les vérifications de rôle par `scope` (admin,
// company, employee) — pas de `authorize()` middleware ici, tout est inline.
// Pas de couche service class à automocker de façon standard : `SearchService`
// est mockée comme les autres (automock + prototype).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/search/application/search.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { SearchService } from "../../../modules/search/application/search.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const searchAdminMock = SearchService.prototype.searchAdmin as jest.Mock;
const searchCompanyMock = SearchService.prototype.searchCompany as jest.Mock;
const searchEmployeeMock = SearchService.prototype.searchEmployee as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "EMPLOYE", organizationId: "org-1", ...overrides });
}

describe("GET /api/search", () => {
  it("200 — retourne un tableau vide sans appeler le service pour une requête trop courte", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/search?q=a&scope=employee").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [] });
    expect(searchEmployeeMock).not.toHaveBeenCalled();
  });

  it("200 — retourne un tableau vide sans appeler le service si q est absent", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/search?scope=employee").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [] });
  });

  it("400 — rejette un scope invalide ou manquant", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/search?q=voyage").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Paramètre scope invalide (employee, company ou admin)" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/search?q=voyage&scope=employee");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("200 — scope=employee : retourne les résultats personnels de l'employé", async () => {
    const cookie = withSession();
    searchEmployeeMock.mockResolvedValueOnce([{ type: "travel", id: "travel-1" }]);

    const res = await request(app).get("/api/search?q=voyage&scope=employee").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [{ type: "travel", id: "travel-1" }] });
  });

  it("403 — scope=employee refusé pour un utilisateur sans organisation", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/search?q=voyage&scope=employee").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(searchEmployeeMock).not.toHaveBeenCalled();
  });

  it("200 — scope=company : retourne les résultats d'un rôle entreprise (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });
    searchCompanyMock.mockResolvedValueOnce([{ type: "user", id: "user-2" }]);

    const res = await request(app).get("/api/search?q=jean&scope=company").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [{ type: "user", id: "user-2" }] });
  });

  it("403 — scope=company refusé pour un EMPLOYE", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/search?q=jean&scope=company").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(searchCompanyMock).not.toHaveBeenCalled();
  });

  it("200 — scope=admin : retourne les résultats plateforme pour un SUPER_ADMIN", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    searchAdminMock.mockResolvedValueOnce([{ type: "organization", id: "org-2" }]);

    const res = await request(app).get("/api/search?q=acme&scope=admin").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ results: [{ type: "organization", id: "org-2" }] });
  });

  it("403 — scope=admin refusé pour un ADMIN (réservé au SUPER_ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/search?q=acme&scope=admin").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(searchAdminMock).not.toHaveBeenCalled();
  });
});
