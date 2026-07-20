// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/contact (src/modules/contact).
//
// ⚠️ GET / et PATCH /:id/status sont AUJOURD'HUI totalement PUBLICS : le
// middleware d'authentification est commenté dans contact.routes.ts
// (`// authMiddleware`, avec le commentaire "uncomment ... when ready"). Ce
// n'est pas un bug introduit ici — c'est l'état actuel, volontairement en
// chantier — mais ça mérite d'être signalé : n'importe qui peut aujourd'hui
// lister les demandes de contact et changer leur statut sans authentification.
// Les tests ci-dessous reflètent ce comportement RÉEL (aucun cookie envoyé,
// 200 attendu) plutôt que de supposer une protection qui n'existe pas encore.
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
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/contact/application/contact.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { ContactService } from "../../../modules/contact/application/contact.service";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const createContactMock = ContactService.prototype.createContact as jest.Mock;
const getAllContactsMock = ContactService.prototype.getAllContacts as jest.Mock;
const updateStatusMock = ContactService.prototype.updateStatus as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

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

// ── GET / (actuellement public — voir note en tête de fichier) ──────────────
describe("GET /api/contact", () => {
  it("200 — retourne la liste des demandes de contact SANS authentification requise", async () => {
    getAllContactsMock.mockResolvedValueOnce([{ id: 1, fullName: "Jean Dupont" }]);

    const res = await request(app).get("/api/contact");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: [{ id: 1, fullName: "Jean Dupont" }] });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    getAllContactsMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/contact");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /:id/status (actuellement public — voir note en tête de fichier) ──
describe("PATCH /api/contact/:id/status", () => {
  it("200 — met à jour le statut d'une demande de contact", async () => {
    updateStatusMock.mockResolvedValueOnce({ id: 1, status: "IN_PROGRESS" });

    const res = await request(app).patch("/api/contact/1/status").send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { id: 1, status: "IN_PROGRESS" } });
    expect(updateStatusMock).toHaveBeenCalledWith(1, "IN_PROGRESS");
  });

  it("400 — rejette un id non numérique (idParamInt)", async () => {
    const res = await request(app).patch("/api/contact/pas-un-nombre/status").send({ status: "DONE" });

    expect(res.status).toBe(400);
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un statut hors de l'énumération autorisée (validation Zod)", async () => {
    const res = await request(app).patch("/api/contact/1/status").send({ status: "ARCHIVED" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.status).toBeDefined();
    expect(updateStatusMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    updateStatusMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/contact/1/status").send({ status: "DONE" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});
