// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/partners (src/modules/partners) —
// gestion admin des partenaires CSE/Voyage. Distinct de /api/partner-portal
// (self-service partenaire) et de /api/partners... (aucune collision, préfixes
// différents).
//
// Style "statusCode dynamique" (comme travel-policies/group-travel/family-members).
// Une seule config RBAC pour tout le routeur (SUPER_ADMIN seul) → 401/403
// testés une fois, sur GET /.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/partners/application/partner.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { PartnerService } from "../../../modules/partners/application/partner.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const listMock = PartnerService.prototype.list as jest.Mock;
const getByIdMock = PartnerService.prototype.getById as jest.Mock;
const createMock = PartnerService.prototype.create as jest.Mock;
const updateMock = PartnerService.prototype.update as jest.Mock;
const deleteMock = PartnerService.prototype.delete as jest.Mock;
const syncMock = PartnerService.prototype.sync as jest.Mock;
const getSyncLogsMock = PartnerService.prototype.getSyncLogs as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

const validPartnerBody = { name: "Le Bon Resto", sector: "Restauration" };

describe("GET /api/partners", () => {
  it("200 — retourne la liste paginée des partenaires", async () => {
    const cookie = withSession();
    listMock.mockResolvedValueOnce({ data: [{ id: "partner-1" }], total: 1, page: 1, limit: 10 });

    const res = await request(app).get("/api/partners?status=ACTIVE").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it("400 — rejette des query params invalides (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/partners?status=INVALID_STATUS").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.status).toBeDefined();
    expect(listMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/partners");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/partners").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(listMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/partners", () => {
  it("201 — crée un partenaire", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "partner-1", ...validPartnerBody });

    const res = await request(app).post("/api/partners").set("Cookie", cookie).send(validPartnerBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "partner-1", ...validPartnerBody });
  });

  it("400 — rejette un corps invalide (nom trop court)", async () => {
    const cookie = withSession();

    const res = await request(app).post("/api/partners").set("Cookie", cookie).send({ name: "X", sector: "Restauration" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.name).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une AppError métier (nom déjà utilisé)", async () => {
    const cookie = withSession();
    createMock.mockRejectedValueOnce(new AppError("Un partenaire avec ce nom existe déjà", 400));

    const res = await request(app).post("/api/partners").set("Cookie", cookie).send(validPartnerBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Un partenaire avec ce nom existe déjà" });
  });
});

describe("GET /api/partners/:id", () => {
  it("200 — retourne le détail d'un partenaire avec ses derniers logs de sync", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "partner-1", name: "Le Bon Resto" });

    const res = await request(app).get("/api/partners/partner-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "partner-1", name: "Le Bon Resto" });
  });

  it("404 — partenaire introuvable", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new AppError("Partenaire introuvable", 404));

    const res = await request(app).get("/api/partners/partner-inconnu").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Partenaire introuvable" });
  });
});

describe("PATCH /api/partners/:id", () => {
  it("200 — met à jour un partenaire", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "partner-1", name: "Le Bon Resto SARL" });

    const res = await request(app)
      .patch("/api/partners/partner-1")
      .set("Cookie", cookie)
      .send({ name: "Le Bon Resto SARL" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "partner-1", name: "Le Bon Resto SARL" });
  });

  it("400 — rejette un corps invalide (URL de site web mal formée)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/partners/partner-1").set("Cookie", cookie).send({ websiteUrl: "pas-une-url" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.websiteUrl).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("404 — partenaire introuvable", async () => {
    const cookie = withSession();
    updateMock.mockRejectedValueOnce(new AppError("Partenaire introuvable", 404));

    const res = await request(app).patch("/api/partners/partner-inconnu").set("Cookie", cookie).send({ name: "Nouveau nom" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Partenaire introuvable" });
  });
});

describe("DELETE /api/partners/:id", () => {
  it("200 — supprime un partenaire", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/partners/partner-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Partenaire supprimé" });
  });

  it("400 — propage une AppError métier (offres actives liées)", async () => {
    const cookie = withSession();
    deleteMock.mockRejectedValueOnce(new AppError("Impossible de supprimer : des offres actives sont liées à ce partenaire", 400));

    const res = await request(app).delete("/api/partners/partner-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Impossible de supprimer : des offres actives sont liées à ce partenaire" });
  });
});

describe("POST /api/partners/:id/sync", () => {
  it("200 — déclenche une synchronisation manuelle", async () => {
    const cookie = withSession();
    syncMock.mockResolvedValueOnce({ status: "SUCCESS", itemsSynced: 12 });

    const res = await request(app).post("/api/partners/partner-1/sync").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "SUCCESS", itemsSynced: 12 });
  });

  it("400 — propage une AppError métier (API désactivée pour ce partenaire)", async () => {
    const cookie = withSession();
    syncMock.mockRejectedValueOnce(new AppError("La synchronisation API n'est pas activée pour ce partenaire", 400));

    const res = await request(app).post("/api/partners/partner-1/sync").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "La synchronisation API n'est pas activée pour ce partenaire" });
  });
});

describe("GET /api/partners/:id/logs", () => {
  it("200 — retourne l'historique des synchronisations", async () => {
    const cookie = withSession();
    getSyncLogsMock.mockResolvedValueOnce([{ id: "log-1", status: "SUCCESS" }]);

    const res = await request(app).get("/api/partners/partner-1/logs").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "log-1", status: "SUCCESS" }]);
  });
});
