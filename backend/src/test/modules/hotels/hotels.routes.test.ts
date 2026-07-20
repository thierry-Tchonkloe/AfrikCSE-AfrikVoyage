// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/hotels (src/modules/hotels).
// Même structure fonctionnelle que flights (voir flights.routes.test.ts pour
// le détail du pattern de mock sur des exports de fonctions, pas une classe).
//
// Particularité : GET /admin/properties/:hotelId/room-types utilise un nom de
// paramètre différent de "id" ("hotelId") — schéma Zod local dédié
// (`hotelIdParam`, exporté par le contrôleur lui-même) plutôt que idParamString.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/hotels/application/hotel.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import * as hotelService from "../../../modules/hotels/application/hotel.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const searchMock = hotelService.search as jest.Mock;
const listCitiesMock = hotelService.listCities as jest.Mock;
const adminListPropertiesMock = hotelService.adminListProperties as jest.Mock;
const adminCreatePropertyMock = hotelService.adminCreateProperty as jest.Mock;
const adminUpdatePropertyMock = hotelService.adminUpdateProperty as jest.Mock;
const adminDeletePropertyMock = hotelService.adminDeleteProperty as jest.Mock;
const adminListRoomTypesMock = hotelService.adminListRoomTypes as jest.Mock;
const adminCreateRoomTypeMock = hotelService.adminCreateRoomType as jest.Mock;
const adminUpdateRoomTypeMock = hotelService.adminUpdateRoomType as jest.Mock;
const adminDeleteRoomTypeMock = hotelService.adminDeleteRoomType as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/hotels/search", () => {
  it("200 — retourne les hôtels d'une ville", async () => {
    const cookie = withSession();
    searchMock.mockResolvedValueOnce([{ id: "hotel-1", city: "Cotonou" }]);

    const res = await request(app).get("/api/hotels/search?city=Cotonou").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "hotel-1", city: "Cotonou" }]);
  });

  it("400 — rejette une requête sans le paramètre city", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/hotels/search").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Paramètre city requis" });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/hotels/search?city=Cotonou");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    searchMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/hotels/search?city=Cotonou").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/hotels/cities", () => {
  it("200 — retourne les villes disponibles", async () => {
    const cookie = withSession();
    listCitiesMock.mockResolvedValueOnce(["Cotonou", "Porto-Novo"]);

    const res = await request(app).get("/api/hotels/cities").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Cotonou", "Porto-Novo"]);
  });
});

describe("GET /api/hotels/admin/properties", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des propriétés", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminListPropertiesMock.mockResolvedValueOnce([{ id: "hotel-1" }]);

    const res = await request(app).get("/api/hotels/admin/properties").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "hotel-1" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/hotels/admin/properties");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/hotels/admin/properties").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(adminListPropertiesMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/hotels/admin/properties", () => {
  it("200 — crée une propriété hôtelière", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    adminCreatePropertyMock.mockResolvedValueOnce({ id: "hotel-1", name: "Hôtel du Port" });

    const res = await request(app)
      .post("/api/hotels/admin/properties")
      .set("Cookie", cookie)
      .send({ name: "Hôtel du Port", city: "Cotonou" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "hotel-1", name: "Hôtel du Port" });
  });
});

describe("PATCH /api/hotels/admin/properties/:id", () => {
  it("200 — met à jour une propriété hôtelière", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminUpdatePropertyMock.mockResolvedValueOnce({ id: "hotel-1", name: "Nouveau nom" });

    const res = await request(app)
      .patch("/api/hotels/admin/properties/hotel-1")
      .set("Cookie", cookie)
      .send({ name: "Nouveau nom" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Nouveau nom");
  });
});

describe("DELETE /api/hotels/admin/properties/:id", () => {
  it("204 — supprime une propriété hôtelière", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminDeletePropertyMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/hotels/admin/properties/hotel-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});

describe("GET /api/hotels/admin/properties/:hotelId/room-types", () => {
  it("200 — retourne les types de chambre d'une propriété (paramètre hotelId, pas id)", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminListRoomTypesMock.mockResolvedValueOnce([{ id: "room-1", name: "Suite" }]);

    const res = await request(app).get("/api/hotels/admin/properties/hotel-1/room-types").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "room-1", name: "Suite" }]);
    expect(adminListRoomTypesMock).toHaveBeenCalledWith("hotel-1");
  });
});

describe("POST /api/hotels/admin/room-types", () => {
  it("200 — crée un type de chambre", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminCreateRoomTypeMock.mockResolvedValueOnce({ id: "room-1", name: "Suite" });

    const res = await request(app)
      .post("/api/hotels/admin/room-types")
      .set("Cookie", cookie)
      .send({ hotelId: "hotel-1", name: "Suite" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "room-1", name: "Suite" });
  });
});

describe("PATCH /api/hotels/admin/room-types/:id", () => {
  it("200 — met à jour un type de chambre", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminUpdateRoomTypeMock.mockResolvedValueOnce({ id: "room-1", name: "Suite Deluxe" });

    const res = await request(app)
      .patch("/api/hotels/admin/room-types/room-1")
      .set("Cookie", cookie)
      .send({ name: "Suite Deluxe" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Suite Deluxe");
  });
});

describe("DELETE /api/hotels/admin/room-types/:id", () => {
  it("204 — supprime un type de chambre", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    adminDeleteRoomTypeMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/hotels/admin/room-types/room-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});
