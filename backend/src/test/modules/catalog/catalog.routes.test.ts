// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/catalog (src/modules/catalog).
//
// Pas de couche service : le contrôleur appelle `CatalogRepository`
// directement (mocké). Style "statusCode dynamique" (`err.statusCode ?? 500`)
// sur create/update/delete ; getById/update/delete font aussi une
// vérification directe "item null/false → 404" en dehors de tout catch.
// `getAll` valide même les QUERY PARAMS via Zod (filterCatalogSchema) — un
// premier dans ce sprint.
//
// RBAC : authenticate seul pour les routes de lecture employé (featured,
// committee, new, categories, GET /, GET /:id) ; authorize(ADMIN, MANAGER,
// SUPER_ADMIN) pour les routes admin (401/403 testés une fois sur GET /admin).
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/catalog/infrastructure/catalog.repository");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { CatalogRepository } from "../../../modules/catalog/infrastructure/catalog.repository";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

const getAllMock = CatalogRepository.prototype.getAll as jest.Mock;
const getFeaturedMock = CatalogRepository.prototype.getFeatured as jest.Mock;
const getCommitteeChoicesMock = CatalogRepository.prototype.getCommitteeChoices as jest.Mock;
const getNewMock = CatalogRepository.prototype.getNew as jest.Mock;
const getByIdMock = CatalogRepository.prototype.getById as jest.Mock;
const getCategoriesMock = CatalogRepository.prototype.getCategories as jest.Mock;
const getAllAdminMock = CatalogRepository.prototype.getAllAdmin as jest.Mock;
const createMock = CatalogRepository.prototype.create as jest.Mock;
const updateMock = CatalogRepository.prototype.update as jest.Mock;
const deleteMock = CatalogRepository.prototype.delete as jest.Mock;
const getAuditHistoryMock = CatalogRepository.prototype.getAuditHistory as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "ADMIN", organizationId: "org-1", ...overrides });
}

const validOfferBody = { title: "Réduction cinéma", category: "Loisirs", subsidyPct: 20, employeePrice: 4000, companyPrice: 5000 };

describe("GET /api/catalog/featured", () => {
  it("200 — retourne les offres boostées actives", async () => {
    const cookie = withSession();
    getFeaturedMock.mockResolvedValueOnce([{ id: "offer-1", title: "Réduction cinéma" }]);

    const res = await request(app).get("/api/catalog/featured").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "offer-1", title: "Réduction cinéma" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/catalog/featured");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getFeaturedMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/catalog/featured").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("GET /api/catalog/committee", () => {
  it("200 — retourne la sélection du comité", async () => {
    const cookie = withSession();
    getCommitteeChoicesMock.mockResolvedValueOnce([{ id: "offer-2" }]);

    const res = await request(app).get("/api/catalog/committee").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "offer-2" }]);
  });
});

describe("GET /api/catalog/new", () => {
  it("200 — retourne les nouvelles offres", async () => {
    const cookie = withSession();
    getNewMock.mockResolvedValueOnce([{ id: "offer-3" }]);

    const res = await request(app).get("/api/catalog/new").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "offer-3" }]);
  });
});

describe("GET /api/catalog/categories", () => {
  it("200 — retourne les catégories distinctes", async () => {
    const cookie = withSession();
    getCategoriesMock.mockResolvedValueOnce(["Loisirs", "Sport"]);

    const res = await request(app).get("/api/catalog/categories").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Loisirs", "Sport"]);
  });
});

describe("GET /api/catalog", () => {
  it("200 — retourne les offres actives filtrées", async () => {
    const cookie = withSession();
    getAllMock.mockResolvedValueOnce([{ id: "offer-1" }]);

    const res = await request(app).get("/api/catalog?category=Loisirs&featured=true").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getAllMock).toHaveBeenCalledWith("org-1", expect.objectContaining({ category: "Loisirs", featured: true }));
  });

  it("400 — rejette des query params invalides (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app).get("/api/catalog?offerType=INVALID_TYPE").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.offerType).toBeDefined();
    expect(getAllMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/catalog/:id", () => {
  it("200 — retourne le détail d'une offre", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "offer-1", title: "Réduction cinéma" });

    const res = await request(app).get("/api/catalog/offer-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "offer-1", title: "Réduction cinéma" });
  });

  it("404 — offre introuvable (vérification directe, pas un catch)", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/catalog/offer-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Introuvable" });
  });
});

describe("GET /api/catalog/admin", () => {
  it("200 — un ADMIN reçoit toutes les offres, y compris inactives", async () => {
    const cookie = withSession();
    getAllAdminMock.mockResolvedValueOnce([{ id: "offer-1", isActive: false }]);

    const res = await request(app).get("/api/catalog/admin").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "offer-1", isActive: false }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/catalog/admin");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).get("/api/catalog/admin").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getAllAdminMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/catalog", () => {
  it("201 — crée une offre", async () => {
    const cookie = withSession();
    createMock.mockResolvedValueOnce({ id: "offer-1", ...validOfferBody });

    const res = await request(app).post("/api/catalog").set("Cookie", cookie).send(validOfferBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "offer-1", ...validOfferBody });
  });

  it("400 — rejette un corps invalide (subsidyPct hors bornes)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .post("/api/catalog")
      .set("Cookie", cookie)
      .send({ ...validOfferBody, subsidyPct: 150 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.subsidyPct).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier avec statusCode dynamique", async () => {
    const cookie = withSession();
    const err: Error & { statusCode?: number } = new Error("Partenaire introuvable");
    err.statusCode = 400;
    createMock.mockRejectedValueOnce(err);

    const res = await request(app).post("/api/catalog").set("Cookie", cookie).send(validOfferBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Partenaire introuvable" });
  });
});

describe("PATCH /api/catalog/:id", () => {
  it("200 — met à jour une offre", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce({ id: "offer-1", title: "Réduction cinéma (modifiée)" });

    const res = await request(app)
      .patch("/api/catalog/offer-1")
      .set("Cookie", cookie)
      .send({ title: "Réduction cinéma (modifiée)" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Réduction cinéma (modifiée)");
  });

  it("400 — rejette un corps invalide (prix négatif)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/catalog/offer-1").set("Cookie", cookie).send({ employeePrice: -100 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.employeePrice).toBeDefined();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("404 — offre introuvable (vérification directe après update)", async () => {
    const cookie = withSession();
    updateMock.mockResolvedValueOnce(null);

    const res = await request(app).patch("/api/catalog/offer-inconnue").set("Cookie", cookie).send({ title: "Nouveau titre" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Introuvable" });
  });

  it("400 — propage une erreur métier avec statusCode dynamique", async () => {
    const cookie = withSession();
    const err: Error & { statusCode?: number } = new Error("Catégorie invalide");
    err.statusCode = 400;
    updateMock.mockRejectedValueOnce(err);

    const res = await request(app).patch("/api/catalog/offer-1").set("Cookie", cookie).send({ category: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Catégorie invalide" });
  });
});

describe("DELETE /api/catalog/:id", () => {
  it("200 — supprime une offre", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(true);

    const res = await request(app).delete("/api/catalog/offer-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Offre supprimée" });
  });

  it("404 — offre introuvable (vérification directe après delete)", async () => {
    const cookie = withSession();
    deleteMock.mockResolvedValueOnce(false);

    const res = await request(app).delete("/api/catalog/offer-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Introuvable" });
  });

  it("400 — propage une erreur métier avec statusCode dynamique", async () => {
    const cookie = withSession();
    const err: Error & { statusCode?: number } = new Error("Offre liée à des commandes actives");
    err.statusCode = 400;
    deleteMock.mockRejectedValueOnce(err);

    const res = await request(app).delete("/api/catalog/offer-1").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Offre liée à des commandes actives" });
  });
});

describe("GET /api/catalog/:id/audit", () => {
  it("200 — retourne l'historique d'audit d'une offre", async () => {
    const cookie = withSession();
    getAuditHistoryMock.mockResolvedValueOnce([{ action: "CREATED", at: "2026-01-01" }]);

    const res = await request(app).get("/api/catalog/offer-1/audit").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ action: "CREATED", at: "2026-01-01" }]);
  });
});
