// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/trains (src/modules/trains).
// Même structure fonctionnelle que flights/hotels (voir flights.routes.test.ts
// pour le détail du pattern de mock sur des exports de fonctions).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/trains/application/train.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import * as trainService from "../../../modules/trains/application/train.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const searchMock = trainService.search as jest.Mock;
const listCitiesMock = trainService.listCities as jest.Mock;
const adminListRoutesMock = trainService.adminListRoutes as jest.Mock;
const adminCreateRouteMock = trainService.adminCreateRoute as jest.Mock;
const adminUpdateRouteMock = trainService.adminUpdateRoute as jest.Mock;
const adminDeleteRouteMock = trainService.adminDeleteRoute as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/trains/search", () => {
  it("200 — retourne les trajets correspondant à la recherche", async () => {
    const cookie = withSession();
    searchMock.mockResolvedValueOnce([{ id: "route-1", from: "Cotonou", to: "Parakou" }]);

    const res = await request(app).get("/api/trains/search?from=Cotonou&to=Parakou").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "route-1", from: "Cotonou", to: "Parakou" }]);
  });

  it("400 — rejette une requête sans les paramètres requis", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/trains/search?from=Cotonou").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Paramètres from et to requis" });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/trains/search?from=Cotonou&to=Parakou");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    searchMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/trains/search?from=Cotonou&to=Parakou").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/trains/cities", () => {
  it("200 — retourne les villes desservies", async () => {
    const cookie = withSession();
    listCitiesMock.mockResolvedValueOnce(["Cotonou", "Parakou"]);

    const res = await request(app).get("/api/trains/cities").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Cotonou", "Parakou"]);
  });
});

describe("GET /api/trains/admin/routes", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des trajets", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminListRoutesMock.mockResolvedValueOnce([{ id: "route-1" }]);

    const res = await request(app).get("/api/trains/admin/routes").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "route-1" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/trains/admin/routes");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/trains/admin/routes").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(adminListRoutesMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/trains/admin/routes", () => {
  it("200 — crée un trajet ferroviaire", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    adminCreateRouteMock.mockResolvedValueOnce({ id: "route-1", from: "Cotonou", to: "Parakou" });

    const res = await request(app)
      .post("/api/trains/admin/routes")
      .set("Cookie", cookie)
      .send({ from: "Cotonou", to: "Parakou" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "route-1", from: "Cotonou", to: "Parakou" });
  });
});

describe("PATCH /api/trains/admin/routes/:id", () => {
  it("200 — met à jour un trajet ferroviaire", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminUpdateRouteMock.mockResolvedValueOnce({ id: "route-1", to: "Natitingou" });

    const res = await request(app)
      .patch("/api/trains/admin/routes/route-1")
      .set("Cookie", cookie)
      .send({ to: "Natitingou" });

    expect(res.status).toBe(200);
    expect(res.body.to).toBe("Natitingou");
  });
});

describe("DELETE /api/trains/admin/routes/:id", () => {
  it("204 — supprime un trajet ferroviaire", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminDeleteRouteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/trains/admin/routes/route-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});
