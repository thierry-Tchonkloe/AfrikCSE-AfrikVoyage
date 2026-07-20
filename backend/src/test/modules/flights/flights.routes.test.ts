// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/flights (src/modules/flights).
//
// Particularité : contrôleur ET service sont des modules de FONCTIONS
// exportées (pas de classe) — `import * as svc from "../application/flight.service"`.
// L'automock Jest remplace donc chaque export nommé par un `jest.fn()`
// directement (pas de `.prototype`), d'où l'accès `flightService.search as
// jest.Mock` ci-dessous plutôt que `Service.prototype.search`.
//
// Aucune validation Zod dans ce module : vérifications manuelles minimales
// (paramètres requis) ; toute erreur du service passe par `next(err)` →
// middleware d'erreurs global. Créer/modifier ne renvoient PAS 201 mais 200
// (`res.json(...)` sans `.status()` explicite) — testé tel quel, pas selon la
// convention REST habituelle.
//
// RBAC : authenticate seul pour /search et /airports (employé) ; authorize
// (SUPER_ADMIN, PLATFORM_MANAGER) pour toutes les routes /admin/* (401/403
// testés une fois, sur GET /admin/routes).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/flights/application/flight.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import * as flightService from "../../../modules/flights/application/flight.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const searchMock = flightService.search as jest.Mock;
const searchAirportsMock = flightService.searchAirports as jest.Mock;
const adminListRoutesMock = flightService.adminListRoutes as jest.Mock;
const adminCreateRouteMock = flightService.adminCreateRoute as jest.Mock;
const adminUpdateRouteMock = flightService.adminUpdateRoute as jest.Mock;
const adminDeleteRouteMock = flightService.adminDeleteRoute as jest.Mock;
const adminListAirportsMock = flightService.adminListAirports as jest.Mock;
const adminCreateAirportMock = flightService.adminCreateAirport as jest.Mock;
const adminUpdateAirportMock = flightService.adminUpdateAirport as jest.Mock;
const adminDeleteAirportMock = flightService.adminDeleteAirport as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/flights/search", () => {
  it("200 — retourne les vols correspondant à la recherche", async () => {
    const cookie = withSession();
    searchMock.mockResolvedValueOnce([{ id: "flight-1", from: "COO", to: "ABJ" }]);

    const res = await request(app)
      .get("/api/flights/search?from=COO&to=ABJ&departureDate=2026-09-01")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "flight-1", from: "COO", to: "ABJ" }]);
  });

  it("400 — rejette une requête sans les paramètres requis", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/flights/search?from=COO").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Paramètres from, to et departureDate requis" });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/flights/search?from=COO&to=ABJ&departureDate=2026-09-01");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    searchMock.mockRejectedValueOnce(new Error("Panne API vols"));

    const res = await request(app)
      .get("/api/flights/search?from=COO&to=ABJ&departureDate=2026-09-01")
      .set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/flights/airports", () => {
  it("200 — retourne les aéroports correspondant au mot-clé", async () => {
    const cookie = withSession();
    searchAirportsMock.mockResolvedValueOnce([{ code: "COO", name: "Cadjehoun" }]);

    const res = await request(app).get("/api/flights/airports?keyword=coto").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: "COO", name: "Cadjehoun" }]);
  });

  it("200 — retourne un tableau vide sans appeler le service pour un mot-clé trop court", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/flights/airports?keyword=c").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(searchAirportsMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/flights/admin/routes", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des routes aériennes", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminListRoutesMock.mockResolvedValueOnce([{ id: "route-1" }]);

    const res = await request(app).get("/api/flights/admin/routes").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "route-1" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/flights/admin/routes");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/flights/admin/routes").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(adminListRoutesMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/flights/admin/routes", () => {
  it("200 — crée une route aérienne (pas 201 : res.json() sans status explicite)", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    adminCreateRouteMock.mockResolvedValueOnce({ id: "route-1", from: "COO", to: "ABJ" });

    const res = await request(app)
      .post("/api/flights/admin/routes")
      .set("Cookie", cookie)
      .send({ from: "COO", to: "ABJ" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "route-1", from: "COO", to: "ABJ" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    adminCreateRouteMock.mockRejectedValueOnce(new Error("Route déjà existante"));

    const res = await request(app).post("/api/flights/admin/routes").set("Cookie", cookie).send({ from: "COO", to: "ABJ" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("PATCH /api/flights/admin/routes/:id", () => {
  it("200 — met à jour une route aérienne", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminUpdateRouteMock.mockResolvedValueOnce({ id: "route-1", from: "COO", to: "DKR" });

    const res = await request(app)
      .patch("/api/flights/admin/routes/route-1")
      .set("Cookie", cookie)
      .send({ to: "DKR" });

    expect(res.status).toBe(200);
    expect(res.body.to).toBe("DKR");
  });
});

describe("DELETE /api/flights/admin/routes/:id", () => {
  it("204 — supprime une route aérienne", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminDeleteRouteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/flights/admin/routes/route-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});

describe("GET /api/flights/admin/airports", () => {
  it("200 — retourne la liste des aéroports (admin)", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminListAirportsMock.mockResolvedValueOnce([{ code: "COO" }]);

    const res = await request(app).get("/api/flights/admin/airports").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: "COO" }]);
  });
});

describe("POST /api/flights/admin/airports", () => {
  it("200 — crée un aéroport", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminCreateAirportMock.mockResolvedValueOnce({ code: "COO", name: "Cadjehoun" });

    const res = await request(app)
      .post("/api/flights/admin/airports")
      .set("Cookie", cookie)
      .send({ code: "COO", name: "Cadjehoun" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: "COO", name: "Cadjehoun" });
  });
});

describe("PATCH /api/flights/admin/airports/:id", () => {
  it("200 — met à jour un aéroport", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminUpdateAirportMock.mockResolvedValueOnce({ code: "COO", name: "Nouveau nom" });

    const res = await request(app)
      .patch("/api/flights/admin/airports/airport-1")
      .set("Cookie", cookie)
      .send({ name: "Nouveau nom" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nouveau nom");
  });
});

describe("DELETE /api/flights/admin/airports/:id", () => {
  it("204 — supprime un aéroport", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminDeleteAirportMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/flights/admin/airports/airport-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});
