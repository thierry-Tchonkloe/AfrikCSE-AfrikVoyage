// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/car-rentals (src/modules/car-rentals).
// Même structure fonctionnelle que flights/hotels/trains (voir
// flights.routes.test.ts pour le détail du pattern de mock).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/car-rentals/application/car-rental.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import * as carRentalService from "../../../modules/car-rentals/application/car-rental.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const searchMock = carRentalService.search as jest.Mock;
const listCitiesMock = carRentalService.listCities as jest.Mock;
const adminListVehiclesMock = carRentalService.adminListVehicles as jest.Mock;
const adminCreateVehicleMock = carRentalService.adminCreateVehicle as jest.Mock;
const adminUpdateVehicleMock = carRentalService.adminUpdateVehicle as jest.Mock;
const adminDeleteVehicleMock = carRentalService.adminDeleteVehicle as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/car-rentals/search", () => {
  it("200 — retourne les véhicules disponibles pour une ville", async () => {
    const cookie = withSession();
    searchMock.mockResolvedValueOnce([{ id: "vehicle-1", city: "Cotonou" }]);

    const res = await request(app).get("/api/car-rentals/search?city=Cotonou&category=SUV").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "vehicle-1", city: "Cotonou" }]);
    expect(searchMock).toHaveBeenCalledWith("Cotonou", "SUV");
  });

  it("400 — rejette une requête sans le paramètre city", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/car-rentals/search").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Paramètre city requis" });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/car-rentals/search?city=Cotonou");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    searchMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/car-rentals/search?city=Cotonou").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/car-rentals/cities", () => {
  it("200 — retourne les villes disponibles", async () => {
    const cookie = withSession();
    listCitiesMock.mockResolvedValueOnce(["Cotonou", "Porto-Novo"]);

    const res = await request(app).get("/api/car-rentals/cities").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Cotonou", "Porto-Novo"]);
  });
});

describe("GET /api/car-rentals/admin/vehicles", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des véhicules", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminListVehiclesMock.mockResolvedValueOnce([{ id: "vehicle-1" }]);

    const res = await request(app).get("/api/car-rentals/admin/vehicles").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "vehicle-1" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/car-rentals/admin/vehicles");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/car-rentals/admin/vehicles").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(adminListVehiclesMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/car-rentals/admin/vehicles", () => {
  it("200 — crée un véhicule", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    adminCreateVehicleMock.mockResolvedValueOnce({ id: "vehicle-1", category: "SUV" });

    const res = await request(app)
      .post("/api/car-rentals/admin/vehicles")
      .set("Cookie", cookie)
      .send({ category: "SUV", city: "Cotonou" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "vehicle-1", category: "SUV" });
  });
});

describe("PATCH /api/car-rentals/admin/vehicles/:id", () => {
  it("200 — met à jour un véhicule", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminUpdateVehicleMock.mockResolvedValueOnce({ id: "vehicle-1", category: "BERLINE" });

    const res = await request(app)
      .patch("/api/car-rentals/admin/vehicles/vehicle-1")
      .set("Cookie", cookie)
      .send({ category: "BERLINE" });

    expect(res.status).toBe(200);
    expect(res.body.category).toBe("BERLINE");
  });
});

describe("DELETE /api/car-rentals/admin/vehicles/:id", () => {
  it("204 — supprime un véhicule", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminDeleteVehicleMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/car-rentals/admin/vehicles/vehicle-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});
