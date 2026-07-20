// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/developer (src/modules/api-developer).
// Contrôleur ET service fonctionnels (pas de classe) — même pattern de mock
// que flights/hotels/trains/car-rentals/country-config. Style `next(err)` +
// errorMiddleware global. Aucune validation Zod sur les corps de requête
// (seulement sur les paramètres de route non standard).
// Une seule config RBAC pour tout le routeur (SUPER_ADMIN, ADMIN).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/api-developer/application/api-developer.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import * as apiDeveloperService from "../../../modules/api-developer/application/api-developer.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listClientsMock = apiDeveloperService.listClients as jest.Mock;
const createClientMock = apiDeveloperService.createClient as jest.Mock;
const revokeClientMock = apiDeveloperService.revokeClient as jest.Mock;
const deleteClientMock = apiDeveloperService.deleteClient as jest.Mock;
const listWebhooksMock = apiDeveloperService.listWebhooks as jest.Mock;
const createWebhookMock = apiDeveloperService.createWebhook as jest.Mock;
const updateWebhookMock = apiDeveloperService.updateWebhook as jest.Mock;
const deleteWebhookMock = apiDeveloperService.deleteWebhook as jest.Mock;
const listDeliveriesMock = apiDeveloperService.listDeliveries as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

describe("GET /api/developer/clients", () => {
  it("200 — retourne les clients API de l'organisation", async () => {
    const cookie = withSession();
    listClientsMock.mockResolvedValueOnce([{ id: "client-1" }]);

    const res = await request(app).get("/api/developer/clients").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "client-1" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/developer/clients");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/developer/clients").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listClientsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listClientsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/developer/clients").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/developer/clients", () => {
  it("201 — crée un client API", async () => {
    const cookie = withSession();
    createClientMock.mockResolvedValueOnce({ id: "client-1", apiKey: "sk_live_xxx" });

    const res = await request(app).post("/api/developer/clients").set("Cookie", cookie).send({ name: "Client CRM" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "client-1", apiKey: "sk_live_xxx" });
  });

  it("400 — propage une erreur métier", async () => {
    const cookie = withSession();
    createClientMock.mockRejectedValueOnce(new AppError("Limite de clients API atteinte", 400));

    const res = await request(app).post("/api/developer/clients").set("Cookie", cookie).send({ name: "Client CRM" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "Limite de clients API atteinte" });
  });
});

describe("PATCH /api/developer/clients/:id/revoke", () => {
  it("200 — révoque un client API", async () => {
    const cookie = withSession();
    revokeClientMock.mockResolvedValueOnce({ id: "client-1", isActive: false });

    const res = await request(app).patch("/api/developer/clients/client-1/revoke").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "client-1", isActive: false });
  });

  it("404 — client API introuvable", async () => {
    const cookie = withSession();
    revokeClientMock.mockRejectedValueOnce(new AppError("Client API introuvable", 404));

    const res = await request(app).patch("/api/developer/clients/client-inconnu/revoke").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Client API introuvable" });
  });
});

describe("DELETE /api/developer/clients/:id", () => {
  it("204 — supprime un client API", async () => {
    const cookie = withSession();
    deleteClientMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/developer/clients/client-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });

  it("404 — client API introuvable", async () => {
    const cookie = withSession();
    deleteClientMock.mockRejectedValueOnce(new AppError("Client API introuvable", 404));

    const res = await request(app).delete("/api/developer/clients/client-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Client API introuvable" });
  });
});

describe("GET /api/developer/webhooks", () => {
  it("200 — retourne les endpoints webhook de l'organisation", async () => {
    const cookie = withSession();
    listWebhooksMock.mockResolvedValueOnce([{ id: "webhook-1" }]);

    const res = await request(app).get("/api/developer/webhooks").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "webhook-1" }]);
  });
});

describe("POST /api/developer/webhooks", () => {
  it("201 — crée un endpoint webhook", async () => {
    const cookie = withSession();
    createWebhookMock.mockResolvedValueOnce({ id: "webhook-1", url: "https://client.example.com/hook" });

    const res = await request(app)
      .post("/api/developer/webhooks")
      .set("Cookie", cookie)
      .send({ url: "https://client.example.com/hook" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "webhook-1", url: "https://client.example.com/hook" });
  });

  it("400 — propage une erreur métier", async () => {
    const cookie = withSession();
    createWebhookMock.mockRejectedValueOnce(new AppError("URL de webhook invalide", 400));

    const res = await request(app).post("/api/developer/webhooks").set("Cookie", cookie).send({ url: "pas-une-url" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, message: "URL de webhook invalide" });
  });
});

describe("PATCH /api/developer/webhooks/:id", () => {
  it("200 — met à jour un endpoint webhook", async () => {
    const cookie = withSession();
    updateWebhookMock.mockResolvedValueOnce({ id: "webhook-1", isActive: false });

    const res = await request(app)
      .patch("/api/developer/webhooks/webhook-1")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "webhook-1", isActive: false });
  });

  it("404 — endpoint webhook introuvable", async () => {
    const cookie = withSession();
    updateWebhookMock.mockRejectedValueOnce(new AppError("Endpoint webhook introuvable", 404));

    const res = await request(app)
      .patch("/api/developer/webhooks/webhook-inconnu")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Endpoint webhook introuvable" });
  });
});

describe("DELETE /api/developer/webhooks/:id", () => {
  it("204 — supprime un endpoint webhook", async () => {
    const cookie = withSession();
    deleteWebhookMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/developer/webhooks/webhook-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
  });
});

describe("GET /api/developer/webhooks/:endpointId/deliveries", () => {
  it("200 — retourne l'historique des livraisons d'un endpoint (paramètre endpointId, pas id)", async () => {
    const cookie = withSession();
    listDeliveriesMock.mockResolvedValueOnce({ data: [{ id: "delivery-1" }], total: 1, page: 1, limit: 30 });

    const res = await request(app).get("/api/developer/webhooks/webhook-1/deliveries").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(listDeliveriesMock).toHaveBeenCalledWith("webhook-1", "org-1", 1, 30);
  });
});
