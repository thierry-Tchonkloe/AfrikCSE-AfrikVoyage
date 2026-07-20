// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/organizations (src/modules/organization).
//
// Même style d'erreur que `settings`/`user` (catch manuel → `{message}`, pas
// de `success:false`, code fixe par méthode — voir settings.routes.test.ts).
// getAll/getPaginated/exportCsv n'ont aucun try/catch → remontent au
// middleware d'erreurs global en cas d'erreur.
//
// Particularité de ce module : certaines routes n'utilisent PAS le service
// mais appellent `prisma` directement depuis le contrôleur (getMyDashboard,
// updateMyOrg, update, reactivate, regenerateInvitation, uploadLogo) — elles
// sont donc testées via `prismaMock`, pas via un mock de méthode de service.
// `uploadLogo` mocke en plus `cloudinary.uploader.upload_stream` (upload
// réel simulé par un buffer via `.attach()`).
//
// RBAC — 3 configurations distinctes dans ce routeur (401/403 testés une
// fois par groupe, sur une route représentative) :
//   (a) SUPER_ADMIN seul (`requireSuper`) → 14 routes (GET /, POST /,
//       /paginated, /export, /:id et toutes les routes /:id/* d'administration)
//   (b) authenticate seul                 → GET /my/dashboard
//   (c) ADMIN, MANAGER                    → PATCH /my, POST /my/logo
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/organization/application/organization.service");
jest.mock("../../../core/config/cloudinary", () => ({
  cloudinary: { uploader: { upload_stream: jest.fn() } },
}));

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { OrganizationService } from "../../../modules/organization/application/organization.service";
import { cloudinary } from "../../../core/config/cloudinary";
import { mockAuthenticatedSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;
const uploadStreamMock = cloudinary.uploader.upload_stream as jest.Mock;

const getAllMock = OrganizationService.prototype.getAll as jest.Mock;
const createByAdminMock = OrganizationService.prototype.createByAdmin as jest.Mock;
const getPaginatedMock = OrganizationService.prototype.getPaginated as jest.Mock;
const getAllForExportMock = OrganizationService.prototype.getAllForExport as jest.Mock;
const getByIdMock = OrganizationService.prototype.getById as jest.Mock;
const validateMock = OrganizationService.prototype.validate as jest.Mock;
const rejectMock = OrganizationService.prototype.reject as jest.Mock;
const updateModulesMock = OrganizationService.prototype.updateModules as jest.Mock;
const suspendMock = OrganizationService.prototype.suspend as jest.Mock;
const validateWithInvitationMock = OrganizationService.prototype.validateWithInvitation as jest.Mock;
const softDeleteMock = OrganizationService.prototype.softDelete as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
  uploadStreamMock.mockReset();
});

function withSession(overrides: Parameters<typeof mockAuthenticatedSession>[2] = {}) {
  return mockAuthenticatedSession(prismaMock, verifyAccessTokenMock, { role: "SUPER_ADMIN", ...overrides });
}

// ── GET / — représentative du groupe (a) requireSuper ────────────────────────
describe("GET /api/organizations", () => {
  it("200 — un SUPER_ADMIN reçoit la liste des organisations", async () => {
    const cookie = withSession();
    getAllMock.mockResolvedValueOnce([{ id: "org-1", name: "Acme" }]);

    const res = await request(app).get("/api/organizations").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "org-1", name: "Acme" }]);
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/organizations");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (ADMIN)", async () => {
    const cookie = withSession({ role: "ADMIN" });

    const res = await request(app).get("/api/organizations").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
    expect(getAllMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur non interceptée localement remonte au middleware d'erreurs global", async () => {
    const cookie = withSession();
    getAllMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/organizations").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST / (createByAdmin) — même groupe (a), 401/403 non répétés ───────────
// Note : cette route ne valide PAS le corps via Zod (contrairement au reste du
// module) — le contrôleur transmet req.body tel quel au service.
describe("POST /api/organizations", () => {
  const validBody = {
    name: "Nouvelle Entreprise", plan: "STARTER", status: "ACTIVE",
    hasVoyage: false, hasCSE: true,
    adminFirstName: "Awa", adminLastName: "Koné", adminEmail: "awa@nouvelle-entreprise.com",
  };

  it("201 — crée une organisation avec son admin", async () => {
    const cookie = withSession();
    createByAdminMock.mockResolvedValueOnce({ id: "org-2", invitationLink: "https://app/activate?token=abc" });

    const res = await request(app).post("/api/organizations").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: "org-2", invitationLink: "https://app/activate?token=abc" });
  });

  it("400 — propage une erreur métier (email admin déjà utilisé)", async () => {
    const cookie = withSession();
    createByAdminMock.mockRejectedValueOnce(new Error("Cet email admin est déjà utilisé"));

    const res = await request(app).post("/api/organizations").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cet email admin est déjà utilisé" });
  });
});

// ── GET /paginated — même groupe (a) ─────────────────────────────────────────
describe("GET /api/organizations/paginated", () => {
  it("200 — retourne une page d'organisations filtrée", async () => {
    const cookie = withSession();
    getPaginatedMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });

    const res = await request(app).get("/api/organizations/paginated?status=PENDING").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(getPaginatedMock).toHaveBeenCalledWith(expect.objectContaining({ status: "PENDING" }));
  });
});

// ── GET /export — même groupe (a) ────────────────────────────────────────────
describe("GET /api/organizations/export", () => {
  it("200 — retourne un export CSV des organisations", async () => {
    const cookie = withSession();
    getAllForExportMock.mockResolvedValueOnce([
      {
        name: "Acme", businessEmail: "contact@acme.com", country: "Bénin", city: "Cotonou", phone: "123",
        plan: "BUSINESS", status: "ACTIVE", hasCSE: true, hasVoyage: false,
        _count: { users: 3 }, users: [{ firstName: "Jean", lastName: "Dupont", email: "jean@acme.com" }],
        createdAt: new Date("2026-01-15"),
      },
    ]);

    const res = await request(app).get("/api/organizations/export").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain("Acme");
  });
});

// ── GET /my/dashboard — groupe (b) authenticate seul, appels prisma directs ──
describe("GET /api/organizations/my/dashboard", () => {
  it("200 — retourne le dashboard de l'organisation connectée", async () => {
    const cookie = withSession({ role: "EMPLOYE", organizationId: "org-1" });
    prismaMock.organization.findUnique.mockResolvedValueOnce({ id: "org-1", name: "Acme" } as never);
    prismaMock.user.count.mockResolvedValueOnce(12);

    const res = await request(app).get("/api/organizations/my/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ org: { id: "org-1", name: "Acme" }, activeUsers: 12 });
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ role: "EMPLOYE", organizationId: null });

    const res = await request(app).get("/api/organizations/my/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation introuvable" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/organizations/my/dashboard");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("500 — catch manuel : une erreur prisma renvoie 500 avec {message} (pas errorMiddleware)", async () => {
    const cookie = withSession({ role: "EMPLOYE", organizationId: "org-1" });
    prismaMock.organization.findUnique.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/organizations/my/dashboard").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

// ── PATCH /my — représentative du groupe (c) ADMIN/MANAGER, prisma direct ───
describe("PATCH /api/organizations/my", () => {
  it("200 — met à jour sa propre organisation", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });
    prismaMock.organization.update.mockResolvedValueOnce({ id: "org-1", name: "Acme SARL" } as never);

    const res = await request(app).patch("/api/organizations/my").set("Cookie", cookie).send({ name: "Acme SARL" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "org-1", name: "Acme SARL" });
  });

  it("400 — rejette un utilisateur sans organisation rattachée", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: null });

    const res = await request(app).patch("/api/organizations/my").set("Cookie", cookie).send({ name: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation introuvable" });
  });

  it("400 — rejette un corps invalide (couleur au mauvais format)", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });

    const res = await request(app).patch("/api/organizations/my").set("Cookie", cookie).send({ primaryColor: "bleu" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.primaryColor).toBeDefined();
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/organizations/my").send({ name: "X" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("403 — refuse l'accès à un rôle non autorisé (EMPLOYE)", async () => {
    const cookie = withSession({ role: "EMPLOYE" });

    const res = await request(app).patch("/api/organizations/my").set("Cookie", cookie).send({ name: "X" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès interdit" });
  });

  it("400 — propage une erreur métier (échec de la mise à jour)", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });
    prismaMock.organization.update.mockRejectedValueOnce(new Error("Échec de la mise à jour"));

    const res = await request(app).patch("/api/organizations/my").set("Cookie", cookie).send({ name: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Échec de la mise à jour" });
  });
});

// ── POST /my/logo — même groupe (c), upload fichier + cloudinary ────────────
describe("POST /api/organizations/my/logo", () => {
  it("200 — upload le logo et met à jour l'organisation", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });
    uploadStreamMock.mockImplementation((_opts: unknown, cb: (err: unknown, r?: { secure_url: string }) => void) => ({
      end: () => cb(null, { secure_url: "https://cdn.example.com/logos/org-1.png" }),
    }));
    prismaMock.organization.update.mockResolvedValueOnce({ logoUrl: "https://cdn.example.com/logos/org-1.png" } as never);

    const res = await request(app)
      .post("/api/organizations/my/logo")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-png-bytes"), "logo.png");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ logoUrl: "https://cdn.example.com/logos/org-1.png" });
  });

  it("400 — rejette une requête sans fichier attaché", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });

    const res = await request(app).post("/api/organizations/my/logo").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Aucun fichier fourni" });
    expect(uploadStreamMock).not.toHaveBeenCalled();
  });

  it("500 — propage un échec d'upload Cloudinary", async () => {
    const cookie = withSession({ role: "ADMIN", organizationId: "org-1" });
    uploadStreamMock.mockImplementation((_opts: unknown, cb: (err: unknown) => void) => ({
      end: () => cb(new Error("Cloudinary indisponible")),
    }));

    const res = await request(app)
      .post("/api/organizations/my/logo")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-png-bytes"), "logo.png");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Cloudinary indisponible" });
  });
});

// ── GET /:id — même groupe (a), 401/403 non répétés ──────────────────────────
describe("GET /api/organizations/:id", () => {
  it("200 — retourne l'organisation demandée", async () => {
    const cookie = withSession();
    getByIdMock.mockResolvedValueOnce({ id: "org-1", name: "Acme" });

    const res = await request(app).get("/api/organizations/org-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "org-1", name: "Acme" });
  });

  it("404 — l'organisation n'existe pas (catch manuel, toujours 404)", async () => {
    const cookie = withSession();
    getByIdMock.mockRejectedValueOnce(new Error("Organisation introuvable"));

    const res = await request(app).get("/api/organizations/org-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Organisation introuvable" });
  });
});

// ── PATCH /:id/validate — même groupe (a) ────────────────────────────────────
describe("PATCH /api/organizations/:id/validate", () => {
  it("200 — valide une organisation en attente", async () => {
    const cookie = withSession();
    validateMock.mockResolvedValueOnce({ id: "org-1", status: "ACTIVE" });

    const res = await request(app)
      .patch("/api/organizations/org-1/validate")
      .set("Cookie", cookie)
      .send({ hasVoyage: true, hasCSE: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Organisation validée", org: { id: "org-1", status: "ACTIVE" } });
  });

  it("400 — rejette un corps invalide (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/organizations/org-1/validate")
      .set("Cookie", cookie)
      .send({ hasVoyage: "oui" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.hasVoyage).toBeDefined();
    expect(validateMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (organisation déjà validée)", async () => {
    const cookie = withSession();
    validateMock.mockRejectedValueOnce(new Error('Impossible de valider une organisation au statut "ACTIVE"'));

    const res = await request(app)
      .patch("/api/organizations/org-1/validate")
      .set("Cookie", cookie)
      .send({ hasVoyage: true, hasCSE: false });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Impossible de valider une organisation au statut "ACTIVE"' });
  });
});

// ── PATCH /:id/reject — même groupe (a) ──────────────────────────────────────
describe("PATCH /api/organizations/:id/reject", () => {
  it("200 — rejette une organisation en attente avec une note", async () => {
    const cookie = withSession();
    rejectMock.mockResolvedValueOnce({ id: "org-1", status: "REJECTED" });

    const res = await request(app)
      .patch("/api/organizations/org-1/reject")
      .set("Cookie", cookie)
      .send({ rejectionNote: "Dossier incomplet, pièces manquantes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Organisation rejetée", org: { id: "org-1", status: "REJECTED" } });
  });

  it("400 — rejette une note de refus trop courte (validation Zod)", async () => {
    const cookie = withSession();

    const res = await request(app)
      .patch("/api/organizations/org-1/reject")
      .set("Cookie", cookie)
      .send({ rejectionNote: "court" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.rejectionNote).toBeDefined();
    expect(rejectMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (organisation non en attente)", async () => {
    const cookie = withSession();
    rejectMock.mockRejectedValueOnce(new Error('Impossible de rejeter une organisation au statut "ACTIVE"'));

    const res = await request(app)
      .patch("/api/organizations/org-1/reject")
      .set("Cookie", cookie)
      .send({ rejectionNote: "Dossier incomplet, pièces manquantes" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Impossible de rejeter une organisation au statut "ACTIVE"' });
  });
});

// ── PATCH /:id/modules — même groupe (a) ─────────────────────────────────────
describe("PATCH /api/organizations/:id/modules", () => {
  it("200 — active/désactive les modules d'une organisation", async () => {
    const cookie = withSession();
    updateModulesMock.mockResolvedValueOnce({ id: "org-1", hasVoyage: true, hasCSE: true });

    const res = await request(app)
      .patch("/api/organizations/org-1/modules")
      .set("Cookie", cookie)
      .send({ hasVoyage: true, hasCSE: true });

    expect(res.status).toBe(200);
    expect(res.body.org).toEqual({ id: "org-1", hasVoyage: true, hasCSE: true });
  });

  it("400 — rejette un corps invalide (champ manquant)", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/organizations/org-1/modules").set("Cookie", cookie).send({ hasVoyage: true });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.hasCSE).toBeDefined();
    expect(updateModulesMock).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur métier (organisation non active)", async () => {
    const cookie = withSession();
    updateModulesMock.mockRejectedValueOnce(new Error("L'organisation doit être active pour modifier ses modules"));

    const res = await request(app)
      .patch("/api/organizations/org-1/modules")
      .set("Cookie", cookie)
      .send({ hasVoyage: true, hasCSE: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "L'organisation doit être active pour modifier ses modules" });
  });
});

// ── PATCH /:id/suspend — même groupe (a) ─────────────────────────────────────
describe("PATCH /api/organizations/:id/suspend", () => {
  it("200 — suspend une organisation", async () => {
    const cookie = withSession();
    suspendMock.mockResolvedValueOnce({ id: "org-1", status: "SUSPENDED" });

    const res = await request(app).patch("/api/organizations/org-1/suspend").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Organisation suspendue", org: { id: "org-1", status: "SUSPENDED" } });
  });

  it("400 — propage une erreur métier (organisation introuvable)", async () => {
    const cookie = withSession();
    suspendMock.mockRejectedValueOnce(new Error("Organisation introuvable"));

    const res = await request(app).patch("/api/organizations/org-inconnue/suspend").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation introuvable" });
  });
});

// ── PATCH /:id/validate-invite — même groupe (a) ─────────────────────────────
describe("PATCH /api/organizations/:id/validate-invite", () => {
  it("200 — valide une organisation et régénère l'invitation", async () => {
    const cookie = withSession();
    validateWithInvitationMock.mockResolvedValueOnce({ id: "org-1", invitationLink: "https://app/activate?token=xyz" });

    const res = await request(app)
      .patch("/api/organizations/org-1/validate-invite")
      .set("Cookie", cookie)
      .send({ hasVoyage: true, hasCSE: false });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "org-1", invitationLink: "https://app/activate?token=xyz" });
  });

  it("400 — propage une erreur métier (organisation non en attente)", async () => {
    const cookie = withSession();
    validateWithInvitationMock.mockRejectedValueOnce(new Error("Organisation non en attente"));

    const res = await request(app)
      .patch("/api/organizations/org-1/validate-invite")
      .set("Cookie", cookie)
      .send({ hasVoyage: true, hasCSE: false });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation non en attente" });
  });
});

// ── DELETE /:id (softDelete) — même groupe (a) ───────────────────────────────
describe("DELETE /api/organizations/:id", () => {
  it("200 — désactive (soft delete) une organisation", async () => {
    const cookie = withSession();
    softDeleteMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/organizations/org-1").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Organisation désactivée" });
  });

  it("400 — propage une erreur métier (organisation introuvable)", async () => {
    const cookie = withSession();
    softDeleteMock.mockRejectedValueOnce(new Error("Organisation introuvable"));

    const res = await request(app).delete("/api/organizations/org-inconnue").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Organisation introuvable" });
  });
});

// ── PATCH /:id — même groupe (a), prisma direct ──────────────────────────────
describe("PATCH /api/organizations/:id", () => {
  it("200 — met à jour les informations générales d'une organisation", async () => {
    const cookie = withSession();
    prismaMock.organization.update.mockResolvedValueOnce({ id: "org-1", name: "Nouveau nom" } as never);

    const res = await request(app).patch("/api/organizations/org-1").set("Cookie", cookie).send({ name: "Nouveau nom" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "org-1", name: "Nouveau nom" });
  });

  it("400 — rejette un corps invalide (champ non whitelisté, schéma .strict())", async () => {
    const cookie = withSession();

    const res = await request(app).patch("/api/organizations/org-1").set("Cookie", cookie).send({ status: "ACTIVE" });

    expect(res.status).toBe(400);
    expect(prismaMock.organization.update).not.toHaveBeenCalled();
  });

  it("400 — propage une erreur prisma (organisation introuvable)", async () => {
    const cookie = withSession();
    prismaMock.organization.update.mockRejectedValueOnce(new Error("Ressource introuvable"));

    const res = await request(app).patch("/api/organizations/org-inconnue").set("Cookie", cookie).send({ name: "X" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Ressource introuvable" });
  });
});

// ── PATCH /:id/reactivate — même groupe (a), prisma direct ───────────────────
describe("PATCH /api/organizations/:id/reactivate", () => {
  it("200 — réactive une organisation suspendue", async () => {
    const cookie = withSession();
    prismaMock.organization.update.mockResolvedValueOnce({ id: "org-1", status: "ACTIVE" } as never);

    const res = await request(app).patch("/api/organizations/org-1/reactivate").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Organisation réactivée", org: { id: "org-1", status: "ACTIVE" } });
  });

  it("400 — propage une erreur prisma (organisation introuvable)", async () => {
    const cookie = withSession();
    prismaMock.organization.update.mockRejectedValueOnce(new Error("Ressource introuvable"));

    const res = await request(app).patch("/api/organizations/org-inconnue/reactivate").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Ressource introuvable" });
  });
});

// ── POST /:id/invite — même groupe (a), prisma direct + import dynamique ────
describe("POST /api/organizations/:id/invite", () => {
  it("200 — régénère un lien d'invitation pour l'admin de l'organisation", async () => {
    const cookie = withSession();
    prismaMock.organization.findUnique.mockResolvedValueOnce({
      id: "org-1",
      users: [{ id: "admin-1" }],
    } as never);
    prismaMock.invitationToken.create.mockResolvedValueOnce({} as never);
    prismaMock.user.update.mockResolvedValueOnce({} as never);

    const res = await request(app).post("/api/organizations/org-1/invite").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.invitationLink).toContain("/activate?token=");
  });

  it("404 — l'organisation n'existe pas (vérification directe, pas un catch)", async () => {
    const cookie = withSession();
    prismaMock.organization.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post("/api/organizations/org-inconnue/invite").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Introuvable" });
  });

  it("500 — propage une erreur prisma inattendue", async () => {
    const cookie = withSession();
    prismaMock.organization.findUnique.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/organizations/org-1/invite").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});
