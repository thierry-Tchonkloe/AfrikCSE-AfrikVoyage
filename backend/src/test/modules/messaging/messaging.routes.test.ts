// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/messaging (src/modules/messaging).
// Repository-direct (MessagingRepository, mocké). Style "code fixe manuel".
//
// Point de vigilance IDOR spécifique à ce module : `getMessages`/`sendMessage`
// ne lèvent PAS d'exception quand l'utilisateur n'a pas accès à la
// conversation — le repository retourne `null`, et le contrôleur traduit ça
// en 403 via une vérification DIRECTE (pas un catch). Testé explicitement.
//
// RBAC : authenticate seul pour tout le routeur, SAUF PATCH /:id/status
// (SUPER_ADMIN uniquement, via un authorize() supplémentaire sur cette seule
// route).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/messaging/infrastructure/messaging.repository");
jest.mock("../../../modules/notification/infrastructure/notification.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { MessagingRepository } from "../../../modules/messaging/infrastructure/messaging.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllConversationsMock = MessagingRepository.prototype.getAllConversations as jest.Mock;
const getConversationsByOrgMock = MessagingRepository.prototype.getConversationsByOrg as jest.Mock;
const getOrCreateSupportConversationMock = MessagingRepository.prototype.getOrCreateSupportConversation as jest.Mock;
const getMessagesMock = MessagingRepository.prototype.getMessages as jest.Mock;
const sendMessageMock = MessagingRepository.prototype.sendMessage as jest.Mock;
const getOtherParticipantsMock = MessagingRepository.prototype.getOtherParticipants as jest.Mock;
const markAsReadMock = MessagingRepository.prototype.markAsRead as jest.Mock;
const getUnreadCountMock = MessagingRepository.prototype.getUnreadCount as jest.Mock;
const updateStatusMock = MessagingRepository.prototype.updateStatus as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
  getOtherParticipantsMock.mockResolvedValue([]);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

describe("GET /api/messaging/conversations", () => {
  it("200 — un ADMIN reçoit les conversations de son organisation", async () => {
    const cookie = withSession({ role: "ADMIN" });
    getConversationsByOrgMock.mockResolvedValueOnce([{ id: "conv-1" }]);

    const res = await request(app).get("/api/messaging/conversations").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "conv-1" }]);
    expect(getAllConversationsMock).not.toHaveBeenCalled();
  });

  it("200 — un SUPER_ADMIN reçoit toutes les conversations de la plateforme", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    getAllConversationsMock.mockResolvedValueOnce({ data: [], total: 0 });

    const res = await request(app).get("/api/messaging/conversations").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getConversationsByOrgMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/messaging/conversations");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession({ role: "ADMIN" });
    getConversationsByOrgMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/messaging/conversations").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/messaging/conversations/support", () => {
  it("200 — ouvre ou récupère la conversation support de l'organisation", async () => {
    const cookie = withSession();
    getOrCreateSupportConversationMock.mockResolvedValueOnce({ id: "conv-support-1" });

    const res = await request(app).get("/api/messaging/conversations/support").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "conv-support-1" });
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ organizationId: null });

    const res = await request(app).get("/api/messaging/conversations/support").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation requise" });
  });

  it("500 — catch manuel : erreur renvoyée en {message}", async () => {
    const cookie = withSession();
    getOrCreateSupportConversationMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/messaging/conversations/support").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

describe("GET /api/messaging/conversations/unread", () => {
  it("200 — retourne le nombre de messages non lus", async () => {
    const cookie = withSession();
    getUnreadCountMock.mockResolvedValueOnce(4);

    const res = await request(app).get("/api/messaging/conversations/unread").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 4 });
  });
});

describe("GET /api/messaging/conversations/:id/messages", () => {
  it("200 — retourne les messages d'une conversation", async () => {
    const cookie = withSession();
    getMessagesMock.mockResolvedValueOnce([{ id: "msg-1", content: "Bonjour" }]);

    const res = await request(app).get("/api/messaging/conversations/conv-1/messages").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "msg-1", content: "Bonjour" }]);
  });

  it("403 — refuse l'accès à une conversation à laquelle l'utilisateur ne participe pas (repository retourne null)", async () => {
    const cookie = withSession();
    getMessagesMock.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/messaging/conversations/conv-dun-autre/messages").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès refusé à cette conversation" });
  });
});

describe("POST /api/messaging/conversations/:id/messages", () => {
  it("201 — envoie un message et notifie les autres participants", async () => {
    const cookie = withSession();
    sendMessageMock.mockResolvedValueOnce({ id: "msg-1", sender: { firstName: "Awa", lastName: "Traoré" } });

    const res = await request(app)
      .post("/api/messaging/conversations/conv-1/messages")
      .set("Cookie", cookie)
      .send({ content: "Bonjour, avez-vous une minute ?" });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("msg-1");
  });

  it("400 — rejette un contenu vide (vérification manuelle, pas Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/messaging/conversations/conv-1/messages").set("Cookie", cookie).send({ content: "   " });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Message vide" });
    expect(sendMessageMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'envoi dans une conversation à laquelle l'utilisateur ne participe pas", async () => {
    const cookie = withSession();
    sendMessageMock.mockResolvedValueOnce(null);

    const res = await request(app)
      .post("/api/messaging/conversations/conv-dun-autre/messages")
      .set("Cookie", cookie)
      .send({ content: "Message non autorisé" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès refusé à cette conversation" });
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    sendMessageMock.mockRejectedValueOnce(new Error("Conversation clôturée"));

    const res = await request(app)
      .post("/api/messaging/conversations/conv-1/messages")
      .set("Cookie", cookie)
      .send({ content: "Message" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Conversation clôturée" });
  });
});

describe("PATCH /api/messaging/conversations/:id/read", () => {
  it("200 — marque une conversation comme lue", async () => {
    const cookie = withSession();
    markAsReadMock.mockResolvedValueOnce(undefined);

    const res = await request(app).patch("/api/messaging/conversations/conv-1/read").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe("PATCH /api/messaging/conversations/:id/status", () => {
  it("200 — un SUPER_ADMIN marque une conversation comme résolue", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    updateStatusMock.mockResolvedValueOnce({ id: "conv-1", status: "RESOLVED" });

    const res = await request(app)
      .patch("/api/messaging/conversations/conv-1/status")
      .set("Cookie", cookie)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "conv-1", status: "RESOLVED" });
  });

  it("400 — rejette un statut invalide (vérification manuelle, pas Zod)", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });

    const res = await request(app)
      .patch("/api/messaging/conversations/conv-1/status")
      .set("Cookie", cookie)
      .send({ status: "ARCHIVED" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Statut invalide" });
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/messaging/conversations/conv-1/status").send({ status: "RESOLVED" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un ADMIN (autorisé sur le reste du module mais pas ici)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app)
      .patch("/api/messaging/conversations/conv-1/status")
      .set("Cookie", cookie)
      .send({ status: "RESOLVED" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    updateStatusMock.mockRejectedValueOnce(new Error("Conversation introuvable"));

    const res = await request(app)
      .patch("/api/messaging/conversations/conv-inconnue/status")
      .set("Cookie", cookie)
      .send({ status: "OPEN" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Conversation introuvable" });
  });
});
