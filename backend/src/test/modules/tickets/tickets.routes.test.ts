// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/tickets (src/modules/tickets).
// Style "statusCode dynamique" partout. POST /validate est PUBLIC (déclarée
// avant `router.use(authenticate)`, destinée au scan par un terminal/agent
// externe, sécurisée par HMAC côté service plutôt que par cookie) — testé
// explicitement sans cookie de session.
// Particularité : /validate répond 200 si le ticket est valide, mais 422
// (Unprocessable Entity) s'il ne l'est PAS — ce n'est pas une erreur/catch,
// juste un statut conditionnel sur `result.valid`.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/tickets/application/ticket.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { TicketService } from "../../../modules/tickets/application/ticket.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const generateMock = TicketService.prototype.generate as jest.Mock;
const getMyTicketsMock = TicketService.prototype.getMyTickets as jest.Mock;
const getByCodeMock = TicketService.prototype.getByCode as jest.Mock;
const validateMock = TicketService.prototype.validate as jest.Mock;
const cancelMock = TicketService.prototype.cancel as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

describe("POST /api/tickets/validate (public — scan terminal)", () => {
  it("200 — valide un ticket authentique", async () => {
    validateMock.mockResolvedValueOnce({ valid: true, ticket: { code: "TCK-1" } });

    const res = await request(app).post("/api/tickets/validate").send({ code: "TCK-1" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ valid: true, ticket: { code: "TCK-1" } });
  });

  it("422 — refuse un ticket déjà utilisé ou expiré (statut conditionnel, pas une erreur)", async () => {
    validateMock.mockResolvedValueOnce({ valid: false, reason: "Ticket déjà utilisé" });

    const res = await request(app).post("/api/tickets/validate").send({ code: "TCK-2" });

    expect(res.status).toBe(422);
    expect(res.body).toEqual({ valid: false, reason: "Ticket déjà utilisé" });
  });

  it("400 — rejette un corps invalide (code manquant)", async () => {
    const res = await request(app).post("/api/tickets/validate").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.code).toBeDefined();
    expect(validateMock).not.toHaveBeenCalled();
  });

  it("404 — propage une AppError métier (code inconnu)", async () => {
    validateMock.mockRejectedValueOnce(new AppError("Ticket introuvable", 404));

    const res = await request(app).post("/api/tickets/validate").send({ code: "TCK-INCONNU" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Ticket introuvable" });
  });
});

describe("POST /api/tickets/generate", () => {
  const validBody = { offerId: "3fa85f64-5717-4562-b3fc-2c963f66afa6" };

  it("201 — génère un ticket pour une offre", async () => {
    const cookie = withSession();
    generateMock.mockResolvedValueOnce({ code: "TCK-1", offerId: validBody.offerId });

    const res = await request(app).post("/api/tickets/generate").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ code: "TCK-1", offerId: validBody.offerId });
  });

  it("400 — rejette un offerId non uuid (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/tickets/generate").set("Cookie", cookie).send({ offerId: "pas-un-uuid" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.offerId).toBeDefined();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/tickets/generate").send(validBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("400 — propage une AppError métier (offre non réservable)", async () => {
    const cookie = withSession();
    generateMock.mockRejectedValueOnce(new AppError("Cette offre ne nécessite pas de ticket", 400));

    const res = await request(app).post("/api/tickets/generate").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cette offre ne nécessite pas de ticket" });
  });
});

describe("GET /api/tickets", () => {
  it("200 — retourne mes tickets", async () => {
    const cookie = withSession();
    getMyTicketsMock.mockResolvedValueOnce([{ code: "TCK-1", status: "VALID" }]);

    const res = await request(app).get("/api/tickets").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ code: "TCK-1", status: "VALID" }]);
  });
});

describe("GET /api/tickets/:code", () => {
  it("200 — retourne le détail d'un ticket par son code", async () => {
    const cookie = withSession();
    getByCodeMock.mockResolvedValueOnce({ code: "TCK-1", status: "VALID" });

    const res = await request(app).get("/api/tickets/TCK-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: "TCK-1", status: "VALID" });
  });

  it("404 — ticket introuvable", async () => {
    const cookie = withSession();
    getByCodeMock.mockRejectedValueOnce(new AppError("Ticket introuvable", 404));

    const res = await request(app).get("/api/tickets/TCK-INCONNU").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Ticket introuvable" });
  });
});

describe("DELETE /api/tickets/:id", () => {
  it("200 — annule un ticket valide", async () => {
    const cookie = withSession();
    cancelMock.mockResolvedValueOnce({ code: "TCK-1", status: "CANCELLED" });

    const res = await request(app).delete("/api/tickets/ticket-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: "TCK-1", status: "CANCELLED" });
  });

  it("400 — propage une AppError métier (ticket déjà utilisé, non annulable)", async () => {
    const cookie = withSession();
    cancelMock.mockRejectedValueOnce(new AppError("Seul un ticket VALID peut être annulé", 400));

    const res = await request(app).delete("/api/tickets/ticket-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Seul un ticket VALID peut être annulé" });
  });
});
