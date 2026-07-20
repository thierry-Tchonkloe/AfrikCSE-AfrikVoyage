// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/events (src/modules/events).
// Repository-direct (EventRepository, mocké), style "code fixe manuel" sur
// create/register/unregister. `sendMail` est best-effort et no-op sans
// configuration Resend (voir email.service.ts : ne lève jamais) — non mocké.
// `NotificationRepository`, en revanche, appelle `prisma.user.findMany(...)`
// puis ITÈRE le résultat : sur un mock prisma non configuré, ça renvoie
// `undefined` et ça crashe ("undefined n'est pas itérable") — donc mocké ici.
// Une seule route protégée par authorize (POST /), le reste authenticate seul.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/events/infrastructure/event.repository");
jest.mock("../../../modules/notification/infrastructure/notification.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { EventRepository } from "../../../modules/events/infrastructure/event.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllMock = EventRepository.prototype.getAll as jest.Mock;
const getUpcomingMock = EventRepository.prototype.getUpcoming as jest.Mock;
const getRecentMock = EventRepository.prototype.getRecent as jest.Mock;
const getStatsMock = EventRepository.prototype.getStats as jest.Mock;
const createMock = EventRepository.prototype.create as jest.Mock;
const registerMock = EventRepository.prototype.register as jest.Mock;
const unregisterMock = EventRepository.prototype.unregister as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "RH", organizationId: "org-1", ...overrides });
}

const validEventBody = {
  title: "Séminaire annuel",
  startDate: "2026-09-01T09:00:00.000Z",
  endDate: "2026-09-01T18:00:00.000Z",
};

describe("GET /api/events", () => {
  it("200 — retourne les événements de l'organisation", async () => {
    const cookie = withSession();
    getAllMock.mockResolvedValueOnce([{ id: "event-1", title: "Séminaire annuel" }]);

    const res = await request(app).get("/api/events").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "event-1", title: "Séminaire annuel" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/events");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getAllMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/events").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/events/upcoming", () => {
  it("200 — retourne les événements à venir", async () => {
    const cookie = withSession();
    getUpcomingMock.mockResolvedValueOnce([{ id: "event-1" }]);

    const res = await request(app).get("/api/events/upcoming").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "event-1" }]);
  });
});

describe("GET /api/events/recent", () => {
  it("200 — retourne les événements récents", async () => {
    const cookie = withSession();
    getRecentMock.mockResolvedValueOnce([{ id: "event-2" }]);

    const res = await request(app).get("/api/events/recent").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "event-2" }]);
  });
});

describe("GET /api/events/stats", () => {
  it("200 — retourne les statistiques d'événements", async () => {
    const cookie = withSession();
    getStatsMock.mockResolvedValueOnce({ total: 5, upcoming: 2 });

    const res = await request(app).get("/api/events/stats").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 5, upcoming: 2 });
  });
});

describe("POST /api/events", () => {
  it("201 — un RH crée un événement", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "event-1", ...validEventBody, startDate: new Date(validEventBody.startDate) });

    const res = await request(app).post("/api/events").set("Cookie", cookie).send(validEventBody);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Séminaire annuel");
  });

  it("400 — rejette une date de fin antérieure à la date de début (validation Zod .refine)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/events")
      .set("Cookie", cookie)
      .send({ ...validEventBody, startDate: "2026-09-05T00:00:00.000Z", endDate: "2026-09-01T00:00:00.000Z" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.endDate).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/events").send(validEventBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).post("/api/events").set("Cookie", cookie).send(validEventBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier du repository", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new Error("Conflit d'agenda"));

    const res = await request(app).post("/api/events").set("Cookie", cookie).send(validEventBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Conflit d'agenda" });
  });
});

describe("POST /api/events/:id/register", () => {
  it("200 — inscrit l'employé à un événement", async () => {
    const cookie = withSession({ role: "EMPLOYE" });
    registerMock.mockResolvedValueOnce({
      user: { firstName: "Awa", email: "awa@acme.com" },
      event: { title: "Séminaire annuel", startDate: new Date(), endDate: new Date(), location: null },
    });

    const res = await request(app).post("/api/events/event-1/register").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("400 — propage une erreur métier (déjà inscrit ou événement complet)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });
    registerMock.mockRejectedValueOnce(new Error("Événement complet"));

    const res = await request(app).post("/api/events/event-1/register").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Événement complet" });
  });
});

describe("DELETE /api/events/:id/register", () => {
  it("200 — désinscrit l'employé d'un événement", async () => {
    const cookie = withSession({ role: "EMPLOYE" });
    unregisterMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/events/event-1/register").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  it("400 — propage une erreur métier (non inscrit)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });
    unregisterMock.mockRejectedValueOnce(new Error("Vous n'êtes pas inscrit à cet événement"));

    const res = await request(app).delete("/api/events/event-1/register").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Vous n'êtes pas inscrit à cet événement" });
  });
});
