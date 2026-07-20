// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/faq (src/modules/faq).
// Style "statusCode dynamique" (comme event-photos/family-members).
// RBAC : authenticate seul pour lecture employé (catégories, liste, vote) ;
// authorize(ADMIN, MANAGER, SUPER_ADMIN) pour l'administration (liste
// complète + CRUD).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/faq/application/faq.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { FaqService } from "../../../modules/faq/application/faq.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listPublishedMock = FaqService.prototype.listPublished as jest.Mock;
const getCategoriesMock = FaqService.prototype.getCategories as jest.Mock;
const voteMock = FaqService.prototype.vote as jest.Mock;
const listAllMock = FaqService.prototype.listAll as jest.Mock;
const createMock = FaqService.prototype.create as jest.Mock;
const updateMock = FaqService.prototype.update as jest.Mock;
const deleteMock = FaqService.prototype.delete as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "EMPLOYE", organizationId: "org-1", ...overrides });
}

const validFaqBody = { question: "Comment demander un avantage CSE ?", answer: "Rendez-vous dans l'espace employé." };

describe("GET /api/faq/categories", () => {
  it("200 — retourne les catégories de FAQ", async () => {
    const cookie = withSession();
    getCategoriesMock.mockResolvedValueOnce(["Général", "Avantages"]);

    const res = await request(app).get("/api/faq/categories").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Général", "Avantages"]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/faq/categories");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getCategoriesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/faq/categories").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/faq", () => {
  it("200 — retourne les entrées FAQ publiées", async () => {
    const cookie = withSession();
    listPublishedMock.mockResolvedValueOnce([{ id: "faq-1", question: "Comment demander un avantage CSE ?" }]);

    const res = await request(app).get("/api/faq?category=Avantages").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "faq-1", question: "Comment demander un avantage CSE ?" }]);
  });
});

describe("POST /api/faq/:id/vote", () => {
  it("200 — vote une entrée FAQ comme utile", async () => {
    const cookie = withSession();
    voteMock.mockResolvedValueOnce({ id: "faq-1", helpfulCount: 5 });

    const res = await request(app).post("/api/faq/faq-1/vote").set("Cookie", cookie).send({ helpful: true });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "faq-1", helpfulCount: 5 });
  });

  it("400 — rejette un corps invalide (helpful manquant)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/faq/faq-1/vote").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.helpful).toBeDefined();
    expect(voteMock).not.toHaveBeenCalled();
  });

  it("404 — entrée FAQ introuvable", async () => {
    const cookie = withSession();
    voteMock.mockRejectedValueOnce(new AppError("Entrée FAQ introuvable", 404));

    const res = await request(app).post("/api/faq/faq-inconnue/vote").set("Cookie", cookie).send({ helpful: false });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Entrée FAQ introuvable" });
  });
});

describe("GET /api/faq/admin", () => {
  it("200 — un ADMIN reçoit toutes les entrées FAQ (y compris brouillons)", async () => {
    const cookie = withSession({ role: "ADMIN" });
    listAllMock.mockResolvedValueOnce([{ id: "faq-1", status: "DRAFT" }]);

    const res = await request(app).get("/api/faq/admin").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "faq-1", status: "DRAFT" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/faq/admin");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/faq/admin").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listAllMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/faq", () => {
  it("201 — un ADMIN crée une entrée FAQ", async () => {
    const cookie = withSession({ role: "ADMIN" });
    createMock.mockResolvedValueOnce({ id: "faq-1", ...validFaqBody });

    const res = await request(app).post("/api/faq").set("Cookie", cookie).send(validFaqBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "faq-1", ...validFaqBody });
  });

  it("400 — rejette un corps invalide (question manquante)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).post("/api/faq").set("Cookie", cookie).send({ answer: "Réponse sans question" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.question).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier", async () => {
    const cookie = withSession({ role: "ADMIN" });
    createMock.mockRejectedValueOnce(new AppError("Une entrée FAQ avec cette question existe déjà", 400));

    const res = await request(app).post("/api/faq").set("Cookie", cookie).send(validFaqBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Une entrée FAQ avec cette question existe déjà" });
  });
});

describe("PATCH /api/faq/:id", () => {
  it("200 — met à jour une entrée FAQ", async () => {
    const cookie = withSession({ role: "ADMIN" });
    updateMock.mockResolvedValueOnce({ id: "faq-1", status: "PUBLISHED" });

    const res = await request(app).patch("/api/faq/faq-1").set("Cookie", cookie).send({ status: "PUBLISHED" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "faq-1", status: "PUBLISHED" });
  });

  it("400 — rejette un corps invalide (statut hors énumération)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).patch("/api/faq/faq-1").set("Cookie", cookie).send({ status: "HIDDEN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.status).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("404 — entrée FAQ introuvable", async () => {
    const cookie = withSession({ role: "ADMIN" });
    updateMock.mockRejectedValueOnce(new AppError("Entrée FAQ introuvable", 404));

    const res = await request(app).patch("/api/faq/faq-inconnue").set("Cookie", cookie).send({ status: "ARCHIVED" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Entrée FAQ introuvable" });
  });
});

describe("DELETE /api/faq/:id", () => {
  it("200 — supprime une entrée FAQ", async () => {
    const cookie = withSession({ role: "ADMIN" });
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/faq/faq-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Entrée FAQ supprimée" });
  });

  it("404 — entrée FAQ introuvable", async () => {
    const cookie = withSession({ role: "ADMIN" });
    deleteMock.mockRejectedValueOnce(new AppError("Entrée FAQ introuvable", 404));

    const res = await request(app).delete("/api/faq/faq-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Entrée FAQ introuvable" });
  });
});
