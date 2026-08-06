// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/contact (src/modules/contact).
//
// GET / et PATCH /:id/status sont réservés aux rôles plateforme (SUPER_ADMIN,
// PLATFORM_MANAGER) : les demandes de contact sont des prospects PLATEFORME,
// pas des données appartenant à une organisation cliente — un ADMIN/MANAGER
// d'entreprise cliente n'y a donc pas accès non plus (403), au même titre
// qu'un visiteur non authentifié (401).
//
// Style d'erreur : ContactController utilise `next(err)` (→ errorMiddleware
// global) pour les erreurs inattendues, mais formate lui-même les échecs de
// validation Zod en `{ success:false, errors: <fieldErrors bruts> }` — sans
// les envelopper dans `.errors.flatten()` comme les autres modules (à ne pas
// confondre avec la forme `{errors:{fieldErrors,formErrors}}` vue ailleurs).
//
// `idParamInt` (utilisé sur PATCH /:id/status) est le premier paramètre
// numérique strict rencontré dans ce sprint — contrairement à `idParamString`
// (accepte toute chaîne non vide), un id non numérique y est réellement
// rejeté avec 400.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/contact/application/contact.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { ContactService } from "../../../modules/contact/application/contact.service";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const createContactMock = ContactService.prototype.createContact as jest.Mock;
const getAllContactsMock = ContactService.prototype.getAllContacts as jest.Mock;
const updateStatusMock = ContactService.prototype.updateStatus as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

const validContactBody = {
  fullName: "Jean Dupont",
  company: "Acme Corp",
  email: "jean.dupont@acme.com",
  message: "Nous souhaitons en savoir plus sur vos offres CSE.",
};

// ── POST / (public) ───────────────────────────────────────────────────────
describe("POST /api/contact", () => {
  it("201 — enregistre une nouvelle demande de contact", async () => {
    createContactMock.mockResolvedValueOnce({ id: 1 });

    const res = await request(app).post("/api/contact").send(validContactBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      success: true,
      message: "Votre demande a bien été enregistrée.",
      data: { id: 1 },
    });
  });

  it("400 — rejette un corps invalide (validation Zod)", async () => {
    const res = await request(app).post("/api/contact").send({ fullName: "J", email: "pas-un-email" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.fullName).toBeDefined();
    expect(res.body.errors.email).toBeDefined();
    expect(res.body.errors.company).toBeDefined();
    expect(createContactMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service au middleware d'erreurs global", async () => {
    createContactMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/contact").send(validContactBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET / (protégé — SUPER_ADMIN / PLATFORM_MANAGER uniquement) ─────────────
describe("GET /api/contact", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des demandes de contact", async () => {
    const cookie = withSession();
    getAllContactsMock.mockResolvedValueOnce([{ id: 1, fullName: "Jean Dupont" }]);

    const res = await request(app).get("/api/contact").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [{ id: 1, fullName: "Jean Dupont" }] });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/contact");

    expect(res.status).toBe(401);
    expect(getAllContactsMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un ADMIN d'organisation cliente (les prospects sont une donnée plateforme, pas tenant)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/contact").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(getAllContactsMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    getAllContactsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/contact").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /:id/status (protégé — SUPER_ADMIN / PLATFORM_MANAGER uniquement) ─
describe("PATCH /api/contact/:id/status", () => {
  it("200 — un PLATFORM_MANAGER met à jour le statut d'une demande de contact", async () => {
    const cookie = withSession({ role: "PLATFORM_MANAGER" });
    updateStatusMock.mockResolvedValueOnce({ id: 1, status: "IN_PROGRESS" });

    const res = await request(app).patch("/api/contact/1/status").set("Cookie", cookie).send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: 1, status: "IN_PROGRESS" } });
    expect(updateStatusMock).toHaveBeenCalledWith(1, "IN_PROGRESS");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/contact/1/status").send({ status: "DONE" });

    expect(res.status).toBe(401);
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un ADMIN d'organisation cliente", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).patch("/api/contact/1/status").set("Cookie", cookie).send({ status: "DONE" });

    expect(res.status).toBe(403);
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un id non numérique (idParamInt)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/contact/pas-un-nombre/status").set("Cookie", cookie).send({ status: "DONE" });

    expect(res.status).toBe(400);
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un statut hors de l'énumération autorisée (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/contact/1/status").set("Cookie", cookie).send({ status: "ARCHIVED" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.status).toBeDefined();
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withSession();
    updateStatusMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/contact/1/status").set("Cookie", cookie).send({ status: "DONE" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
