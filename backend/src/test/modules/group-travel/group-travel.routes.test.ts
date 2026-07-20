// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/group-travel (src/modules/group-travel).
//
// Style d'erreur "statusCode dynamique" (comme travel-policies/family-members).
// Une seule config RBAC (authenticate seul, pas de authorize) → pas de test 403.
// `list` n'a aucun try/catch → remonte au middleware d'erreurs global.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/group-travel/application/group-travel.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { GroupTravelService } from "../../../modules/group-travel/application/group-travel.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listMock = GroupTravelService.prototype.list as jest.Mock;
const getByIdMock = GroupTravelService.prototype.getById as jest.Mock;
const createMock = GroupTravelService.prototype.create as jest.Mock;
const updateMock = GroupTravelService.prototype.update as jest.Mock;
const updateStatusMock = GroupTravelService.prototype.updateStatus as jest.Mock;
const deleteMock = GroupTravelService.prototype.delete as jest.Mock;
const inviteMock = GroupTravelService.prototype.invite as jest.Mock;
const respondMock = GroupTravelService.prototype.respond as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

const validTripBody = {
  title: "Séminaire Dakar", destination: "Dakar",
  departureDate: "2026-09-01T00:00:00.000Z", returnDate: "2026-09-05T00:00:00.000Z",
};

describe("GET /api/group-travel", () => {
  it("200 — retourne les voyages de groupe visibles par l'utilisateur", async () => {
    const cookie = withSession();
    listMock.mockResolvedValueOnce([{ id: "trip-1", title: "Séminaire Dakar" }]);

    const res = await request(app).get("/api/group-travel").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "trip-1", title: "Séminaire Dakar" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/group-travel");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/group-travel").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/group-travel", () => {
  it("201 — crée un voyage de groupe", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "trip-1", ...validTripBody });

    const res = await request(app).post("/api/group-travel").set("Cookie", cookie).send(validTripBody);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Séminaire Dakar");
  });

  it("400 — rejette un corps invalide (destination manquante)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/group-travel")
      .set("Cookie", cookie)
      .send({ title: "X", departureDate: validTripBody.departureDate, returnDate: validTripBody.returnDate });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.destination).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new AppError("Organisation introuvable", 400));

    const res = await request(app).post("/api/group-travel").set("Cookie", cookie).send(validTripBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation introuvable" });
  });
});

describe("GET /api/group-travel/:id", () => {
  it("200 — retourne le voyage de groupe demandé", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "trip-1", title: "Séminaire Dakar" });

    const res = await request(app).get("/api/group-travel/trip-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "trip-1", title: "Séminaire Dakar" });
  });

  it("404 — voyage de groupe introuvable", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new AppError("Voyage de groupe introuvable", 404));

    const res = await request(app).get("/api/group-travel/trip-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Voyage de groupe introuvable" });
  });
});

describe("PATCH /api/group-travel/:id", () => {
  it("200 — met à jour un voyage de groupe", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "trip-1", title: "Séminaire Dakar (modifié)" });

    const res = await request(app)
      .patch("/api/group-travel/trip-1")
      .set("Cookie", cookie)
      .send({ title: "Séminaire Dakar (modifié)" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "trip-1", title: "Séminaire Dakar (modifié)" });
  });

  it("400 — rejette un corps invalide (titre vide)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/group-travel/trip-1").set("Cookie", cookie).send({ title: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.title).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("403 — seul l'organisateur peut modifier le voyage", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new AppError("Seul l'organisateur peut modifier ce voyage", 403));

    const res = await request(app)
      .patch("/api/group-travel/trip-1")
      .set("Cookie", cookie)
      .send({ title: "Tentative de modification" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Seul l'organisateur peut modifier ce voyage" });
  });
});

describe("PATCH /api/group-travel/:id/status", () => {
  it("200 — change le statut du voyage de groupe", async () => {
    const cookie = withSession();
    updateStatusMock.mockResolvedValueOnce({ id: "trip-1", status: "OPEN" });

    const res = await request(app).patch("/api/group-travel/trip-1/status").set("Cookie", cookie).send({ status: "OPEN" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "trip-1", status: "OPEN" });
  });

  it("400 — rejette un statut hors énumération (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/group-travel/trip-1/status")
      .set("Cookie", cookie)
      .send({ status: "ARCHIVED" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.status).toBeDefined();
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (transition de statut invalide)", async () => {
    const cookie = withSession();
    updateStatusMock.mockRejectedValueOnce(new AppError("Transition de statut invalide", 400));

    const res = await request(app)
      .patch("/api/group-travel/trip-1/status")
      .set("Cookie", cookie)
      .send({ status: "COMPLETED" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Transition de statut invalide" });
  });
});

describe("DELETE /api/group-travel/:id", () => {
  it("200 — supprime un voyage de groupe", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/group-travel/trip-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Voyage supprimé" });
  });

  it("403 — seul l'organisateur peut supprimer le voyage", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new AppError("Seul l'organisateur peut supprimer ce voyage", 403));

    const res = await request(app).delete("/api/group-travel/trip-1").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Seul l'organisateur peut supprimer ce voyage" });
  });
});

describe("POST /api/group-travel/:id/invite", () => {
  it("201 — invite un salarié au voyage de groupe", async () => {
    const cookie = withSession();
    inviteMock.mockResolvedValueOnce({ id: "invite-1", status: "PENDING" });

    const res = await request(app)
      .post("/api/group-travel/trip-1/invite")
      .set("Cookie", cookie)
      .send({ userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "invite-1", status: "PENDING" });
  });

  it("400 — rejette un userId non uuid (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/group-travel/trip-1/invite")
      .set("Cookie", cookie)
      .send({ userId: "pas-un-uuid" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.userId).toBeDefined();
    expect(inviteMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (déjà invité)", async () => {
    const cookie = withSession();
    inviteMock.mockRejectedValueOnce(new AppError("Cet utilisateur est déjà invité", 400));

    const res = await request(app)
      .post("/api/group-travel/trip-1/invite")
      .set("Cookie", cookie)
      .send({ userId: "3fa85f64-5717-4562-b3fc-2c963f66afa6" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cet utilisateur est déjà invité" });
  });
});

describe("POST /api/group-travel/:id/respond", () => {
  it("200 — répond à une invitation de voyage de groupe", async () => {
    const cookie = withSession();
    respondMock.mockResolvedValueOnce({ id: "invite-1", status: "ACCEPTED" });

    const res = await request(app)
      .post("/api/group-travel/trip-1/respond")
      .set("Cookie", cookie)
      .send({ accept: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "invite-1", status: "ACCEPTED" });
  });

  it("400 — rejette un corps invalide (accept manquant)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/group-travel/trip-1/respond").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.accept).toBeDefined();
    expect(respondMock).not.toHaveBeenCalled();
  });

  it("404 — invitation introuvable", async () => {
    const cookie = withSession();
    respondMock.mockRejectedValueOnce(new AppError("Invitation introuvable", 404));

    const res = await request(app)
      .post("/api/group-travel/trip-1/respond")
      .set("Cookie", cookie)
      .send({ accept: false, note: "Indisponible" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Invitation introuvable" });
  });
});
