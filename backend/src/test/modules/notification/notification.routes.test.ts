// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/notifications (src/modules/notification).
// Repository-direct (NotificationRepository, mocké). Les routes employé
// n'ont aucun try/catch (→ errorMiddleware global) ; les routes admin
// (templates/logs) utilisent `next(err)` explicitement — même résultat, mais
// écrit différemment.
//
// RBAC — 3 configurations :
//   (a) authenticate seul                        → routes employé
//   (b) SUPER_ADMIN, PLATFORM_MANAGER             → templates (GET/PUT), logs
//   (c) SUPER_ADMIN seul                          → DELETE template (plus
//       strict que le reste de la section templates)
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/notification/infrastructure/notification.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { NotificationRepository } from "../../../modules/notification/infrastructure/notification.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getForUserMock = NotificationRepository.prototype.getForUser as jest.Mock;
const getUnreadCountMock = NotificationRepository.prototype.getUnreadCount as jest.Mock;
const markAsReadMock = NotificationRepository.prototype.markAsRead as jest.Mock;
const markAllAsReadMock = NotificationRepository.prototype.markAllAsRead as jest.Mock;
const listTemplatesMock = NotificationRepository.prototype.listTemplates as jest.Mock;
const upsertTemplateMock = NotificationRepository.prototype.upsertTemplate as jest.Mock;
const deleteTemplateMock = NotificationRepository.prototype.deleteTemplate as jest.Mock;
const listLogsMock = NotificationRepository.prototype.listLogs as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("GET /api/notifications", () => {
  it("200 — retourne mes notifications paginées", async () => {
    const cookie = withSession();
    getForUserMock.mockResolvedValueOnce({ data: [{ id: "notif-1" }], total: 1, page: 1, limit: 20 });

    const res = await request(app).get("/api/notifications").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/notifications");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getForUserMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/notifications").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("200 — retourne le nombre de notifications non lues", async () => {
    const cookie = withSession();
    getUnreadCountMock.mockResolvedValueOnce(5);

    const res = await request(app).get("/api/notifications/unread-count").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ count: 5 });
  });
});

describe("PATCH /api/notifications/read-all", () => {
  it("200 — marque toutes mes notifications comme lues", async () => {
    const cookie = withSession();
    markAllAsReadMock.mockResolvedValueOnce(undefined);

    const res = await request(app).patch("/api/notifications/read-all").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe("PATCH /api/notifications/:id/read", () => {
  it("200 — marque une notification comme lue", async () => {
    const cookie = withSession();
    markAsReadMock.mockResolvedValueOnce(undefined);

    const res = await request(app).patch("/api/notifications/notif-1/read").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });
});

describe("GET /api/notifications/admin/templates", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des templates de notification", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    listTemplatesMock.mockResolvedValueOnce([{ event: "WALLET_CREDITED" }]);

    const res = await request(app).get("/api/notifications/admin/templates").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ event: "WALLET_CREDITED" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/notifications/admin/templates");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/notifications/admin/templates").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listTemplatesMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue via next(err)", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    listTemplatesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/notifications/admin/templates").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("PUT /api/notifications/admin/templates/:event", () => {
  it("200 — un PLATFORM_MANAGER met à jour un template de notification", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    upsertTemplateMock.mockResolvedValueOnce({ event: "WALLET_CREDITED", isActive: true });

    const res = await request(app)
      .put("/api/notifications/admin/templates/WALLET_CREDITED")
      .set("Cookie", cookie)
      .send({ inAppTitle: "Crédit reçu" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ event: "WALLET_CREDITED", isActive: true });
  });

  it("400 — rejette un corps invalide (canal hors énumération)", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });

    const res = await request(app)
      .put("/api/notifications/admin/templates/WALLET_CREDITED")
      .set("Cookie", cookie)
      .send({ channels: ["CARRIER_PIGEON"] });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.channels).toBeDefined();
    expect(upsertTemplateMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/notifications/admin/templates/:event", () => {
  it("204 — un SUPER_ADMIN supprime un template de notification", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    deleteTemplateMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/notifications/admin/templates/WALLET_CREDITED").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });

  it("403 — refuse l'accès à un PLATFORM_MANAGER (autorisé sur GET/PUT templates mais pas DELETE)", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });

    const res = await request(app).delete("/api/notifications/admin/templates/WALLET_CREDITED").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(deleteTemplateMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/notifications/admin/logs", () => {
  it("200 — retourne le journal des notifications envoyées", async () => {
    const cookie = withSession({ role: "SUPER_ADMIN" });
    listLogsMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 50 });

    const res = await request(app).get("/api/notifications/admin/logs").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [], total: 0, page: 1, limit: 50 });
  });
});
