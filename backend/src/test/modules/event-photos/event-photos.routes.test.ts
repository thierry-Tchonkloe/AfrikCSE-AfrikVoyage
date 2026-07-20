// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/event-photos (src/modules/event-photos).
// Style "statusCode dynamique" (comme family-members/travel-policies).
// RBAC : authenticate seul pour lecture/upload/like ; authorize(ADMIN, MANAGER,
// SUPER_ADMIN) pour la modération et le compteur en attente.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/event-photos/application/event-photo.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { EventPhotoService } from "../../../modules/event-photos/application/event-photo.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listByEventMock = EventPhotoService.prototype.listByEvent as jest.Mock;
const uploadMock = EventPhotoService.prototype.upload as jest.Mock;
const moderateMock = EventPhotoService.prototype.moderate as jest.Mock;
const deleteMock = EventPhotoService.prototype.delete as jest.Mock;
const toggleLikeMock = EventPhotoService.prototype.toggleLike as jest.Mock;
const getPendingCountMock = EventPhotoService.prototype.getPendingCount as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "EMPLOYE", organizationId: "org-1", ...overrides });
}

const validUploadBody = { eventId: "event-1", url: "https://cdn.example.com/photo.jpg" };

describe("GET /api/event-photos/event/:eventId", () => {
  it("200 — retourne les photos publiées d'un événement", async () => {
    const cookie = withSession();
    listByEventMock.mockResolvedValueOnce([{ id: "photo-1" }]);

    const res = await request(app).get("/api/event-photos/event/event-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "photo-1" }]);
    expect(listByEventMock).toHaveBeenCalledWith("event-1", "org-1", false);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/event-photos/event/event-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listByEventMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/event-photos/event/event-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/event-photos", () => {
  it("201 — uploade une photo d'événement (en attente de modération)", async () => {
    const cookie = withSession();
    uploadMock.mockResolvedValueOnce({ id: "photo-1", status: "PENDING" });

    const res = await request(app).post("/api/event-photos").set("Cookie", cookie).send(validUploadBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "photo-1", status: "PENDING" });
  });

  it("400 — rejette un corps invalide (URL manquante)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/event-photos").set("Cookie", cookie).send({ eventId: "event-1" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.url).toBeDefined();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (événement introuvable)", async () => {
    const cookie = withSession();
    uploadMock.mockRejectedValueOnce(new AppError("Événement introuvable", 400));

    const res = await request(app).post("/api/event-photos").set("Cookie", cookie).send(validUploadBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Événement introuvable" });
  });
});

describe("POST /api/event-photos/:id/like", () => {
  it("200 — bascule le like d'une photo", async () => {
    const cookie = withSession();
    toggleLikeMock.mockResolvedValueOnce({ liked: true, likeCount: 4 });

    const res = await request(app).post("/api/event-photos/photo-1/like").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ liked: true, likeCount: 4 });
  });

  it("404 — photo introuvable", async () => {
    const cookie = withSession();
    toggleLikeMock.mockRejectedValueOnce(new AppError("Photo introuvable", 404));

    const res = await request(app).post("/api/event-photos/photo-inconnue/like").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Photo introuvable" });
  });
});

describe("PATCH /api/event-photos/:id/moderate", () => {
  it("200 — un ADMIN modère une photo", async () => {
    const cookie = withSession({ role: "ADMIN" });
    moderateMock.mockResolvedValueOnce({ id: "photo-1", status: "APPROVED" });

    const res = await request(app)
      .patch("/api/event-photos/photo-1/moderate")
      .set("Cookie", cookie)
      .send({ status: "APPROVED" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "photo-1", status: "APPROVED" });
  });

  it("400 — rejette un statut hors énumération (validation Zod)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .patch("/api/event-photos/photo-1/moderate")
      .set("Cookie", cookie)
      .send({ status: "PENDING" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.status).toBeDefined();
    expect(moderateMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/event-photos/photo-1/moderate").send({ status: "APPROVED" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app)
      .patch("/api/event-photos/photo-1/moderate")
      .set("Cookie", cookie)
      .send({ status: "APPROVED" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(moderateMock).not.toHaveBeenCalled();
  });

  it("404 — photo introuvable", async () => {
    const cookie = withSession({ role: "ADMIN" });
    moderateMock.mockRejectedValueOnce(new AppError("Photo introuvable", 404));

    const res = await request(app)
      .patch("/api/event-photos/photo-inconnue/moderate")
      .set("Cookie", cookie)
      .send({ status: "REJECTED" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Photo introuvable" });
  });
});

describe("GET /api/event-photos/pending/count", () => {
  it("200 — retourne le nombre de photos en attente de modération", async () => {
    const cookie = withSession({ role: "MANAGER" });
    getPendingCountMock.mockResolvedValueOnce(7);

    const res = await request(app).get("/api/event-photos/pending/count").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 7 });
  });
});

describe("DELETE /api/event-photos/:id", () => {
  it("200 — l'auteur supprime sa propre photo", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/event-photos/photo-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Photo supprimée" });
  });

  it("403 — refuse la suppression d'une photo appartenant à un autre employé (pas admin)", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new AppError("Vous ne pouvez supprimer que vos propres photos", 403));

    const res = await request(app).delete("/api/event-photos/photo-dun-autre-employe").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Vous ne pouvez supprimer que vos propres photos" });
  });
});
