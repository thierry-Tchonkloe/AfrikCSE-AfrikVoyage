// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/communication (src/modules/communication).
// Repository-direct (CommunicationRepository, mocké), style "code fixe manuel"
// (400 sur toute erreur métier). `NotificationRepository` est aussi mockée :
// sa méthode `createForOrg` appelle `prisma.user.findMany(...)` puis ITÈRE
// le résultat — sur un mock prisma non configuré ça renvoie `undefined` et ça
// crashe ("undefined n'est pas itérable"), voir events.routes.test.ts.
// Une seule config RBAC (authenticate seul, pas de authorize) → pas de 403.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/communication/infrastructure/communication.repository");
jest.mock("../../../modules/notification/infrastructure/notification.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { CommunicationRepository } from "../../../modules/communication/infrastructure/communication.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getPostsMock = CommunicationRepository.prototype.getPosts as jest.Mock;
const createPostMock = CommunicationRepository.prototype.createPost as jest.Mock;
const toggleLikeMock = CommunicationRepository.prototype.toggleLike as jest.Mock;
const addCommentMock = CommunicationRepository.prototype.addComment as jest.Mock;
const getCommentsMock = CommunicationRepository.prototype.getComments as jest.Mock;
const voteMock = CommunicationRepository.prototype.vote as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/communication/posts", () => {
  it("200 — retourne les publications de l'organisation", async () => {
    const cookie = withSession();
    getPostsMock.mockResolvedValueOnce({ data: [{ id: "post-1" }], total: 1, page: 1 });

    const res = await request(app).get("/api/communication/posts").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/communication/posts");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getPostsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/communication/posts").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/communication/posts", () => {
  const validBody = { type: "ARTICLE", content: "Nouvelle publication interne" };

  it("201 — crée une publication", async () => {
    const cookie = withSession();
    createPostMock.mockResolvedValueOnce({ id: "post-1", type: "ARTICLE", content: validBody.content });

    const res = await request(app).post("/api/communication/posts").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.content).toBe(validBody.content);
  });

  it("400 — rejette un corps invalide (type hors énumération)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/communication/posts")
      .set("Cookie", cookie)
      .send({ type: "VIDEO", content: "X" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.type).toBeDefined();
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    createPostMock.mockRejectedValueOnce(new Error("Sondage sans options"));

    const res = await request(app)
      .post("/api/communication/posts")
      .set("Cookie", cookie)
      .send({ type: "POLL", content: "Vote", pollOptions: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Sondage sans options" });
  });
});

describe("POST /api/communication/posts/:id/like", () => {
  it("200 — bascule le like d'une publication", async () => {
    const cookie = withSession();
    toggleLikeMock.mockResolvedValueOnce({ liked: true, likeCount: 3 });

    const res = await request(app).post("/api/communication/posts/post-1/like").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ liked: true, likeCount: 3 });
  });

  it("400 — propage une erreur métier (publication introuvable)", async () => {
    const cookie = withSession();
    toggleLikeMock.mockRejectedValueOnce(new Error("Publication introuvable"));

    const res = await request(app).post("/api/communication/posts/post-inconnu/like").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Publication introuvable" });
  });
});

describe("POST /api/communication/posts/:id/comment", () => {
  it("201 — ajoute un commentaire à une publication", async () => {
    const cookie = withSession();
    addCommentMock.mockResolvedValueOnce({ id: "comment-1", content: "Merci pour le partage !" });

    const res = await request(app)
      .post("/api/communication/posts/post-1/comment")
      .set("Cookie", cookie)
      .send({ content: "Merci pour le partage !" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "comment-1", content: "Merci pour le partage !" });
  });

  it("400 — rejette un commentaire vide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/communication/posts/post-1/comment").set("Cookie", cookie).send({ content: "" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.content).toBeDefined();
    expect(addCommentMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (publication introuvable)", async () => {
    const cookie = withSession();
    addCommentMock.mockRejectedValueOnce(new Error("Publication introuvable"));

    const res = await request(app)
      .post("/api/communication/posts/post-inconnu/comment")
      .set("Cookie", cookie)
      .send({ content: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Publication introuvable" });
  });
});

describe("GET /api/communication/posts/:id/comments", () => {
  it("200 — retourne les commentaires d'une publication", async () => {
    const cookie = withSession();
    getCommentsMock.mockResolvedValueOnce([{ id: "comment-1", content: "Super !" }]);

    const res = await request(app).get("/api/communication/posts/post-1/comments").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "comment-1", content: "Super !" }]);
  });

  it("400 — propage une erreur métier (publication introuvable)", async () => {
    const cookie = withSession();
    getCommentsMock.mockRejectedValueOnce(new Error("Publication introuvable"));

    const res = await request(app).get("/api/communication/posts/post-inconnu/comments").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Publication introuvable" });
  });
});

describe("POST /api/communication/poll-options/:id/vote", () => {
  it("200 — vote pour une option de sondage", async () => {
    const cookie = withSession();
    voteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).post("/api/communication/poll-options/option-1/vote").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("400 — propage une erreur métier (déjà voté)", async () => {
    const cookie = withSession();
    voteMock.mockRejectedValueOnce(new Error("Vous avez déjà voté pour ce sondage"));

    const res = await request(app).post("/api/communication/poll-options/option-1/vote").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Vous avez déjà voté pour ce sondage" });
  });
});
