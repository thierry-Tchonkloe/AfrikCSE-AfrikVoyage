// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/family-members (src/modules/family-members).
//
// Style d'erreur : `FamilyMemberController` catche manuellement, mais LIT le
// statusCode de l'erreur (`res.status(err.statusCode ?? 500)`) plutôt que de
// le fixer en dur par méthode — un cinquième style distinct rencontré dans ce
// projet (voir organization/user/settings pour le style "code fixe", orders/
// cashback/wallet/bookings/partner-portal pour `errorMiddleware`+`AppError`,
// et contact pour `next(err)` + Zod formaté à la main). Ici, une `AppError`
// mockée avec son propre statusCode est donc respectée telle quelle ; une
// erreur générique retombe sur 500.
//
// Une seule config RBAC (authenticate seul, pas de authorize) → pas de test
// 403 pour ce module.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/family-members/application/family-member.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { FamilyMemberService } from "../../../modules/family-members/application/family-member.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listMock = FamilyMemberService.prototype.list as jest.Mock;
const getByIdMock = FamilyMemberService.prototype.getById as jest.Mock;
const createMock = FamilyMemberService.prototype.create as jest.Mock;
const updateMock = FamilyMemberService.prototype.update as jest.Mock;
const deleteMock = FamilyMemberService.prototype.delete as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, overrides);
}

const validBody = { firstName: "Aïcha", lastName: "Diallo", relationship: "CHILD" };

// ── GET / (list) ──────────────────────────────────────────────────────────
describe("GET /api/family-members", () => {
  it("200 — retourne mes membres de famille actifs", async () => {
    const cookie = withSession();
    listMock.mockResolvedValueOnce([{ id: "fm-1", firstName: "Aïcha" }]);

    const res = await request(app).get("/api/family-members").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "fm-1", firstName: "Aïcha" }]);
    expect(listMock).toHaveBeenCalledWith("user-1", "org-1");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/family-members");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    listMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/family-members").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST / (create) ───────────────────────────────────────────────────────
describe("POST /api/family-members", () => {
  it("201 — ajoute un membre de famille", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "fm-1", ...validBody });

    const res = await request(app).post("/api/family-members").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "fm-1", ...validBody });
  });

  it("400 — rejette un corps invalide (relation hors énumération)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/family-members")
      .set("Cookie", cookie)
      .send({ ...validBody, relationship: "COUSIN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.relationship).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier avec son propre statusCode (ex: quota atteint)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new AppError("Nombre maximum de membres de famille atteint", 400));

    const res = await request(app).post("/api/family-members").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Nombre maximum de membres de famille atteint" });
  });
});

// ── GET /:id (getById) ────────────────────────────────────────────────────
describe("GET /api/family-members/:id", () => {
  it("200 — retourne le membre de famille demandé", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "fm-1", firstName: "Aïcha" });

    const res = await request(app).get("/api/family-members/fm-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "fm-1", firstName: "Aïcha" });
  });

  it("404 — membre introuvable ou appartenant à un autre utilisateur (statusCode lu depuis l'AppError)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new AppError("Membre de famille introuvable", 404));

    const res = await request(app).get("/api/family-members/fm-dun-autre-user").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Membre de famille introuvable" });
  });

  it("500 — une erreur générique (sans statusCode) retombe sur 500 par défaut", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Erreur inattendue"));

    const res = await request(app).get("/api/family-members/fm-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Erreur inattendue" });
  });
});

// ── PATCH /:id (update) ───────────────────────────────────────────────────
describe("PATCH /api/family-members/:id", () => {
  it("200 — met à jour un membre de famille", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "fm-1", firstName: "Aïcha Fatou" });

    const res = await request(app)
      .patch("/api/family-members/fm-1")
      .set("Cookie", cookie)
      .send({ firstName: "Aïcha Fatou" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "fm-1", firstName: "Aïcha Fatou" });
  });

  it("400 — rejette un corps invalide (relation hors énumération)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/family-members/fm-1")
      .set("Cookie", cookie)
      .send({ relationship: "COUSIN" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.relationship).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("404 — membre introuvable ou appartenant à un autre utilisateur", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new AppError("Membre de famille introuvable", 404));

    const res = await request(app)
      .patch("/api/family-members/fm-dun-autre-user")
      .set("Cookie", cookie)
      .send({ firstName: "X" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Membre de famille introuvable" });
  });
});

// ── DELETE /:id (delete) ──────────────────────────────────────────────────
describe("DELETE /api/family-members/:id", () => {
  it("200 — désactive (soft-delete) un membre de famille", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/family-members/fm-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Membre de famille supprimé" });
  });

  it("404 — membre introuvable ou appartenant à un autre utilisateur", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new AppError("Membre de famille introuvable", 404));

    const res = await request(app).delete("/api/family-members/fm-dun-autre-user").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Membre de famille introuvable" });
  });
});
