// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/partner-portal (src/modules/partner-portal).
//
// Stratégie d'isolation (identique aux modules précédents) :
// - `core/config/prisma` → mocké : utilisé par `authenticatePartner`.
// - `modules/partner-portal/application/partner-portal.service` → mocké
//   (automock) : isole le routing/validation/RBAC/contrôleur du moteur réel
//   (bcrypt, JWT, repository Prisma).
// - `session-helpers.ts` → `mockAuthenticatedPartnerSession` (JWT réel signé,
//   voir bookings.routes.test.ts pour le détail de ce choix).
//
// ⚠️ Vigilance IDOR (demande explicite) : la plupart des méthodes du service
// qui opèrent sur un id (locations, offers, staff) n'ont PAS de vérification
// explicite façon `AppError("Accès interdit", 403)` comme dans le module
// bookings — l'isolation multi-partenaire est assurée par le repository via
// une clause `WHERE id = ? AND partnerId = ?` : si la ressource appartient à
// un AUTRE partenaire, Prisma ne trouve simplement aucune ligne et lève une
// erreur "enregistrement introuvable" (code P2025), traduite par le
// middleware d'erreurs global en 404 "Ressource introuvable" — PAS un 403.
// C'est un choix anti-IDOR délibéré et cohérent avec le reste du code (voir
// aussi bookings.service.getById : même message pour "inexistant" et
// "appartient à quelqu'un d'autre", afin de ne jamais laisser fuiter
// l'existence d'une ressource étrangère). Chaque test d'isolation ci-dessous
// simule ce P2025 et vérifie explicitement le 404, avec un commentaire dédié.
//
// Ce module expose aussi TROIS variantes distinctes de « accès refusé » à ne
// pas confondre :
//   1. POST /login  → 403 AppError "Accès au portail partenaire désactivé"
//      (compte partenaire suspendu, avant même l'authentification par cookie)
//   2. GET/POST /staff, PATCH /staff/:id/deactivate → 403 RBAC
//      "Accès réservé aux administrateurs partenaires" (requirePartnerAdmin)
//   3. 404 anti-IDOR décrit ci-dessus (PAS un 403, volontairement)
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/partner-portal/application/partner-portal.service");

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { PartnerPortalService } from "../../../modules/partner-portal/application/partner-portal.service";
import { AppError } from "../../../core/errors/app.error";
import { mockAuthenticatedPartnerSession } from "../../session-helpers";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Instance singleton créée au chargement de partner-portal.controller.ts — en
// automock, les méthodes du prototype sont partagées par toute instance
// `new PartnerPortalService()`.
const loginMock = PartnerPortalService.prototype.login as jest.Mock;
const refreshMock = PartnerPortalService.prototype.refresh as jest.Mock;
const logoutMock = PartnerPortalService.prototype.logout as jest.Mock;
const meMock = PartnerPortalService.prototype.me as jest.Mock;
const getProfileMock = PartnerPortalService.prototype.getProfile as jest.Mock;
const updateProfileMock = PartnerPortalService.prototype.updateProfile as jest.Mock;
const createLocationMock = PartnerPortalService.prototype.createLocation as jest.Mock;
const updateLocationMock = PartnerPortalService.prototype.updateLocation as jest.Mock;
const deleteLocationMock = PartnerPortalService.prototype.deleteLocation as jest.Mock;
const setAvailabilitiesMock = PartnerPortalService.prototype.setAvailabilities as jest.Mock;
const listOffersMock = PartnerPortalService.prototype.listOffers as jest.Mock;
const createOfferMock = PartnerPortalService.prototype.createOffer as jest.Mock;
const updateOfferMock = PartnerPortalService.prototype.updateOffer as jest.Mock;
const setOfferActiveMock = PartnerPortalService.prototype.setOfferActive as jest.Mock;
const getHostOrgIdMock = PartnerPortalService.prototype.getHostOrgId as jest.Mock;
const listStaffMock = PartnerPortalService.prototype.listStaff as jest.Mock;
const createStaffMock = PartnerPortalService.prototype.createStaff as jest.Mock;
const deactivateStaffMock = PartnerPortalService.prototype.deactivateStaff as jest.Mock;
const uploadOfferImageMock = PartnerPortalService.prototype.uploadOfferImage as jest.Mock;
const getSettingsMock = PartnerPortalService.prototype.getSettings as jest.Mock;
const updateCurrencyMock = PartnerPortalService.prototype.updateCurrency as jest.Mock;
const updateApiIntegrationMock = PartnerPortalService.prototype.updateApiIntegration as jest.Mock;
const listPaymentMethodsMock = PartnerPortalService.prototype.listPaymentMethods as jest.Mock;
const createPaymentMethodMock = PartnerPortalService.prototype.createPaymentMethod as jest.Mock;
const updatePaymentMethodMock = PartnerPortalService.prototype.updatePaymentMethod as jest.Mock;
const deletePaymentMethodMock = PartnerPortalService.prototype.deletePaymentMethod as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
  // createOffer/updateOffer résolvent l'org hôte puis vérifient que la
  // catégorie soumise existe réellement pour elle (cf. partner-portal.validator.ts).
  getHostOrgIdMock.mockResolvedValue("host-org-1");
  prismaMock.benefitCategory.findFirst.mockResolvedValue({ id: "cat-1" } as never);
});

function withPartnerSession(overrides: Parameters<typeof mockAuthenticatedPartnerSession>[1] = {}) {
  return mockAuthenticatedPartnerSession(prismaMock, overrides);
}

/** Simule le P2025 Prisma remonté par le repository quand la ressource id
 * n'existe pas OU appartient à un autre partenaire (clause WHERE id+partnerId
 * sans résultat) — voir note anti-IDOR en tête de fichier. */
function foreignOrMissingResourceError() {
  const err: Error & { code?: string } = new Error("Record to update not found");
  err.code = "P2025";
  return err;
}

const validLoginBody = { email: "contact@partenaire.com", password: "SecretPass123" };
// `notes` n'est plus un champ modifiable ici (réservé au Super Admin, cf.
// updateProfileSchema) — retiré de ce corps de requête valide.
const validProfileUpdateBody = { contactEmail: "contact@partenaire.com" };
const validLocationBody = { name: "Boutique Cocody", address: "Rue des Jardins", city: "Abidjan" };
const validAvailabilitiesBody = { slots: [{ openTime: "08:00", closeTime: "18:00" }] };
const validOfferBody = { title: "Réduction 20%", category: "Restauration", employeePrice: 5000, companyPrice: 6000, imageUrl: "https://res.cloudinary.com/afrikcse/offers/photo.jpg" };
const validStaffBody = { email: "staff@partenaire.com", password: "StaffPass123", firstName: "Jean", lastName: "Kouassi" };

// ── POST /login (public) ──────────────────────────────────────────────────────
describe("POST /api/partner-portal/login", () => {
  it("200 — connecte un utilisateur partenaire et pose les cookies dédiés", async () => {
    loginMock.mockResolvedValueOnce({
      accessToken: "partner-at",
      refreshToken: "partner-rt",
      user: { id: "partner-user-1", email: validLoginBody.email, role: "PARTNER_ADMIN", partnerId: "partner-1", partnerName: "Le Bon Resto" },
    });

    const res = await request(app).post("/api/partner-portal/login").send(validLoginBody);

    expect(res.status).toBe(200);
    expect(res.body.user.partnerId).toBe("partner-1");
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("partnerAccessToken="))).toBe(true);
    expect(cookies.some((c) => c.startsWith("partnerRefreshToken="))).toBe(true);
  });

  it("400 — rejette un corps invalide (validation Zod)", async () => {
    const res = await request(app).post("/api/partner-portal/login").send({ email: "pas-un-email" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.email).toBeDefined();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("401 — rejette des identifiants incorrects", async () => {
    loginMock.mockRejectedValueOnce(new AppError("Identifiants invalides", 401));

    const res = await request(app).post("/api/partner-portal/login").send(validLoginBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Identifiants invalides" });
  });

  it("403 — refuse la connexion d'un compte partenaire suspendu", async () => {
    loginMock.mockRejectedValueOnce(new AppError("Accès au portail partenaire désactivé", 403));

    const res = await request(app).post("/api/partner-portal/login").send(validLoginBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: "Accès au portail partenaire désactivé" });
  });
});

// ── POST /refresh (public) ────────────────────────────────────────────────────
describe("POST /api/partner-portal/refresh", () => {
  it("200 — renouvelle la paire de tokens à partir du cookie partnerRefreshToken", async () => {
    refreshMock.mockResolvedValueOnce({ accessToken: "new-partner-at", refreshToken: "new-partner-rt" });

    const res = await request(app)
      .post("/api/partner-portal/refresh")
      .set("Cookie", ["partnerRefreshToken=ancien-refresh"]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("partnerAccessToken="))).toBe(true);
  });

  it("400 — rejette l'absence de cookie partnerRefreshToken", async () => {
    const res = await request(app).post("/api/partner-portal/refresh");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Refresh token requis" });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("401 — rejette un refresh token invalide", async () => {
    refreshMock.mockRejectedValueOnce(new AppError("Refresh token invalide", 401));

    const res = await request(app)
      .post("/api/partner-portal/refresh")
      .set("Cookie", ["partnerRefreshToken=refresh-invalide"]);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Refresh token invalide" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    refreshMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .post("/api/partner-portal/refresh")
      .set("Cookie", ["partnerRefreshToken=un-refresh"]);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /logout ──────────────────────────────────────────────────────────────
describe("POST /api/partner-portal/logout", () => {
  it("200 — déconnecte le partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    logoutMock.mockResolvedValueOnce(undefined);

    const res = await request(app).post("/api/partner-portal/logout").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Déconnecté avec succès" });
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).post("/api/partner-portal/logout");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    logoutMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/partner-portal/logout").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /me ────────────────────────────────────────────────────────────────
describe("GET /api/partner-portal/me", () => {
  it("200 — retourne la session partenaire courante", async () => {
    const cookie = withPartnerSession();
    meMock.mockResolvedValueOnce({ id: "partner-user-1", email: "contact@partenaire.com", partnerId: "partner-1" });

    const res = await request(app).get("/api/partner-portal/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.partnerId).toBe("partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/partner-portal/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("401 — session invalidée côté service (compte désactivé entre-temps)", async () => {
    const cookie = withPartnerSession();
    meMock.mockRejectedValueOnce(new AppError("Session expirée, veuillez vous reconnecter", 401));

    const res = await request(app).get("/api/partner-portal/me").set("Cookie", cookie);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: "Session expirée, veuillez vous reconnecter" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    meMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/partner-portal/me").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /profile ───────────────────────────────────────────────────────────
describe("GET /api/partner-portal/profile", () => {
  it("200 — retourne le profil du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    getProfileMock.mockResolvedValueOnce({ id: "partner-1", name: "Le Bon Resto" });

    const res = await request(app).get("/api/partner-portal/profile").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: "partner-1", name: "Le Bon Resto" });
    expect(getProfileMock).toHaveBeenCalledWith("partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/partner-portal/profile");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — le partenaire n'existe plus", async () => {
    const cookie = withPartnerSession();
    getProfileMock.mockRejectedValueOnce(new AppError("Partenaire introuvable", 404));

    const res = await request(app).get("/api/partner-portal/profile").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Partenaire introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    getProfileMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/partner-portal/profile").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /profile — PARTNER_ADMIN uniquement (requirePartnerAdmin) ─────────
describe("PATCH /api/partner-portal/profile", () => {
  it("200 — un PARTNER_ADMIN met à jour le profil de son partenaire", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    updateProfileMock.mockResolvedValueOnce({ id: "partner-1", ...validProfileUpdateBody });

    const res = await request(app).patch("/api/partner-portal/profile").set("Cookie", cookie).send(validProfileUpdateBody);

    expect(res.status).toBe(200);
    expect(updateProfileMock).toHaveBeenCalledWith("partner-1", expect.objectContaining(validProfileUpdateBody));
  });

  it("400 — rejette un corps invalide (URL de site web mal formée)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });

    const res = await request(app)
      .patch("/api/partner-portal/profile")
      .set("Cookie", cookie)
      .send({ websiteUrl: "pas-une-url" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.websiteUrl).toBeDefined();
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un PARTNER_STAFF (ne peut plus écraser les notes internes du Super Admin)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app).patch("/api/partner-portal/profile").set("Cookie", cookie).send(validProfileUpdateBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès réservé aux administrateurs partenaires" });
    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/profile").send(validProfileUpdateBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    updateProfileMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/partner-portal/profile").set("Cookie", cookie).send(validProfileUpdateBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /locations ────────────────────────────────────────────────────────
describe("POST /api/partner-portal/locations", () => {
  it("201 — crée une boutique pour le partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    createLocationMock.mockResolvedValueOnce({ id: "location-1", ...validLocationBody });

    const res = await request(app).post("/api/partner-portal/locations").set("Cookie", cookie).send(validLocationBody);

    expect(res.status).toBe(201);
    expect(createLocationMock).toHaveBeenCalledWith("partner-1", expect.objectContaining(validLocationBody));
  });

  it("400 — rejette un corps invalide (champs requis manquants)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app).post("/api/partner-portal/locations").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.name).toBeDefined();
    expect(res.body.errors.fieldErrors.address).toBeDefined();
    expect(createLocationMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).post("/api/partner-portal/locations").send(validLocationBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    createLocationMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/partner-portal/locations").set("Cookie", cookie).send(validLocationBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /locations/:id ───────────────────────────────────────────────────
describe("PATCH /api/partner-portal/locations/:id", () => {
  it("200 — met à jour une boutique du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    updateLocationMock.mockResolvedValueOnce({ id: "location-1", name: "Boutique renommée" });

    const res = await request(app)
      .patch("/api/partner-portal/locations/location-1")
      .set("Cookie", cookie)
      .send({ name: "Boutique renommée" });

    expect(res.status).toBe(200);
    expect(updateLocationMock).toHaveBeenCalledWith("location-1", "partner-1", expect.objectContaining({ name: "Boutique renommée" }));
  });

  it("400 — rejette un corps invalide (type incorrect)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app)
      .patch("/api/partner-portal/locations/location-1")
      .set("Cookie", cookie)
      .send({ isMain: "oui" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.isMain).toBeDefined();
    expect(updateLocationMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/locations/location-1").send({ name: "X" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — isolation multi-tenant : boutique inexistante ou appartenant à un AUTRE partenaire (anti-IDOR, pas de 403)", async () => {
    const cookie = withPartnerSession();
    updateLocationMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app)
      .patch("/api/partner-portal/locations/location-dun-autre-partenaire")
      .set("Cookie", cookie)
      .send({ name: "Tentative de modification" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    updateLocationMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .patch("/api/partner-portal/locations/location-1")
      .set("Cookie", cookie)
      .send({ name: "X" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── DELETE /locations/:id ──────────────────────────────────────────────────
describe("DELETE /api/partner-portal/locations/:id", () => {
  it("204 — supprime une boutique du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    deleteLocationMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/partner-portal/locations/location-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(deleteLocationMock).toHaveBeenCalledWith("location-1", "partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).delete("/api/partner-portal/locations/location-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — isolation multi-tenant : impossible de supprimer la boutique d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession();
    deleteLocationMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app).delete("/api/partner-portal/locations/location-dun-autre-partenaire").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    deleteLocationMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).delete("/api/partner-portal/locations/location-1").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PUT /locations/:locationId/availabilities ──────────────────────────────
describe("PUT /api/partner-portal/locations/:locationId/availabilities", () => {
  it("200 — remplace les créneaux d'ouverture d'une boutique du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    setAvailabilitiesMock.mockResolvedValueOnce({ locationId: "location-1", slots: validAvailabilitiesBody.slots });

    const res = await request(app)
      .put("/api/partner-portal/locations/location-1/availabilities")
      .set("Cookie", cookie)
      .send(validAvailabilitiesBody);

    expect(res.status).toBe(200);
    expect(setAvailabilitiesMock).toHaveBeenCalledWith("location-1", "partner-1", expect.any(Array));
  });

  it("400 — rejette un créneau au format d'heure invalide (validation Zod)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app)
      .put("/api/partner-portal/locations/location-1/availabilities")
      .set("Cookie", cookie)
      .send({ slots: [{ openTime: "8h00", closeTime: "18:00" }] });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.slots).toBeDefined();
    expect(setAvailabilitiesMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app)
      .put("/api/partner-portal/locations/location-1/availabilities")
      .send(validAvailabilitiesBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — isolation multi-tenant : boutique d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession();
    setAvailabilitiesMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app)
      .put("/api/partner-portal/locations/location-dun-autre-partenaire/availabilities")
      .set("Cookie", cookie)
      .send(validAvailabilitiesBody);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    setAvailabilitiesMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .put("/api/partner-portal/locations/location-1/availabilities")
      .set("Cookie", cookie)
      .send(validAvailabilitiesBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /offers ────────────────────────────────────────────────────────────
describe("GET /api/partner-portal/offers", () => {
  it("200 — retourne les offres du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    listOffersMock.mockResolvedValueOnce([{ id: "offer-1", title: "Réduction 20%" }]);

    const res = await request(app).get("/api/partner-portal/offers").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(listOffersMock).toHaveBeenCalledWith("partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/partner-portal/offers");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    listOffersMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/partner-portal/offers").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /offers ───────────────────────────────────────────────────────────
describe("POST /api/partner-portal/offers", () => {
  it("201 — crée une offre pour le partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    createOfferMock.mockResolvedValueOnce({ id: "offer-1", ...validOfferBody });

    const res = await request(app).post("/api/partner-portal/offers").set("Cookie", cookie).send(validOfferBody);

    expect(res.status).toBe(201);
    expect(createOfferMock).toHaveBeenCalledWith("partner-1", "host-org-1", expect.objectContaining({ title: validOfferBody.title }));
  });

  it("400 — rejette un corps invalide (champs requis manquants)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app).post("/api/partner-portal/offers").set("Cookie", cookie).send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.title).toBeDefined();
    expect(res.body.errors.fieldErrors.category).toBeDefined();
    expect(createOfferMock).not.toHaveBeenCalled();
  });

  it("400 — rejette une offre sans image (image obligatoire dès la création)", async () => {
    const cookie = withPartnerSession();
    const { imageUrl, ...bodyWithoutImage } = validOfferBody;
    void imageUrl;

    const res = await request(app).post("/api/partner-portal/offers").set("Cookie", cookie).send(bodyWithoutImage);

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.imageUrl).toBeDefined();
    expect(createOfferMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).post("/api/partner-portal/offers").send(validOfferBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    createOfferMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/partner-portal/offers").set("Cookie", cookie).send(validOfferBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /offers/:id ──────────────────────────────────────────────────────
describe("PATCH /api/partner-portal/offers/:id", () => {
  it("200 — met à jour une offre du partenaire authentifié", async () => {
    const cookie = withPartnerSession();
    updateOfferMock.mockResolvedValueOnce({ id: "offer-1", title: "Réduction 30%" });

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1")
      .set("Cookie", cookie)
      .send({ title: "Réduction 30%" });

    expect(res.status).toBe(200);
    expect(updateOfferMock).toHaveBeenCalledWith("offer-1", "partner-1", expect.objectContaining({ title: "Réduction 30%" }));
  });

  it("400 — rejette un corps invalide (prix négatif)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1")
      .set("Cookie", cookie)
      .send({ employeePrice: -100 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.employeePrice).toBeDefined();
    expect(updateOfferMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/offers/offer-1").send({ title: "X" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — isolation multi-tenant : offre d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession();
    updateOfferMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app)
      .patch("/api/partner-portal/offers/offre-dun-autre-partenaire")
      .set("Cookie", cookie)
      .send({ title: "Tentative de modification" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession();
    updateOfferMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1")
      .set("Cookie", cookie)
      .send({ title: "X" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /offers/:id/toggle-active ──────────────────────────────────────────
describe("PATCH /api/partner-portal/offers/:id/toggle-active", () => {
  it("200 — masque une offre (isActive: false toujours permis)", async () => {
    const cookie = withPartnerSession();
    setOfferActiveMock.mockResolvedValueOnce({ id: "offer-1", isActive: false });

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1/toggle-active")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(setOfferActiveMock).toHaveBeenCalledWith("offer-1", "partner-1", false);
  });

  it("200 — réactive une offre déjà APPROVED", async () => {
    const cookie = withPartnerSession();
    setOfferActiveMock.mockResolvedValueOnce({ id: "offer-1", isActive: true, reviewStatus: "APPROVED" });

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1/toggle-active")
      .set("Cookie", cookie)
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(setOfferActiveMock).toHaveBeenCalledWith("offer-1", "partner-1", true);
  });

  it("400 — refuse d'activer une offre non APPROVED (PENDING ou REJECTED)", async () => {
    const cookie = withPartnerSession();
    setOfferActiveMock.mockRejectedValueOnce(
      new AppError("Cette offre doit être approuvée par le Super Admin avant de pouvoir être réactivée", 400)
    );

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1/toggle-active")
      .set("Cookie", cookie)
      .send({ isActive: true });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      message: "Cette offre doit être approuvée par le Super Admin avant de pouvoir être réactivée",
    });
  });

  it("400 — rejette un corps invalide (isActive manquant)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app)
      .patch("/api/partner-portal/offers/offer-1/toggle-active")
      .set("Cookie", cookie)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.isActive).toBeDefined();
    expect(setOfferActiveMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/offers/offer-1/toggle-active").send({ isActive: true });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("404 — isolation multi-tenant : offre d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession();
    setOfferActiveMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app)
      .patch("/api/partner-portal/offers/offre-dun-autre-partenaire/toggle-active")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });
});

// ── GET /staff — PARTNER_ADMIN uniquement (requirePartnerAdmin) ─────────────
describe("GET /api/partner-portal/staff", () => {
  it("200 — un PARTNER_ADMIN reçoit la liste du personnel de son partenaire", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    listStaffMock.mockResolvedValueOnce([{ id: "staff-1", email: "staff@partenaire.com" }]);

    const res = await request(app).get("/api/partner-portal/staff").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(listStaffMock).toHaveBeenCalledWith("partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/partner-portal/staff");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("403 — refuse l'accès à un PARTNER_STAFF (réservé aux administrateurs partenaires)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app).get("/api/partner-portal/staff").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès réservé aux administrateurs partenaires" });
    expect(listStaffMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    listStaffMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).get("/api/partner-portal/staff").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /staff — PARTNER_ADMIN uniquement ───────────────────────────────────
describe("POST /api/partner-portal/staff", () => {
  it("201 — un PARTNER_ADMIN crée un compte membre du personnel", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN", partnerUserId: "admin-1" });
    createStaffMock.mockResolvedValueOnce({ id: "staff-1", email: validStaffBody.email });

    const res = await request(app).post("/api/partner-portal/staff").set("Cookie", cookie).send(validStaffBody);

    expect(res.status).toBe(201);
    expect(createStaffMock).toHaveBeenCalledWith("partner-1", "admin-1", expect.objectContaining({ email: validStaffBody.email }));
  });

  it("400 — rejette un corps invalide (mot de passe trop court)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });

    const res = await request(app)
      .post("/api/partner-portal/staff")
      .set("Cookie", cookie)
      .send({ ...validStaffBody, password: "court" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.password).toBeDefined();
    expect(createStaffMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).post("/api/partner-portal/staff").send(validStaffBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("403 — refuse l'accès à un PARTNER_STAFF (réservé aux administrateurs partenaires)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app).post("/api/partner-portal/staff").set("Cookie", cookie).send(validStaffBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès réservé aux administrateurs partenaires" });
    expect(createStaffMock).not.toHaveBeenCalled();
  });

  it("409 — rejette un email déjà utilisé par un autre compte", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    createStaffMock.mockRejectedValueOnce(new AppError("Un utilisateur avec cet email existe déjà", 409));

    const res = await request(app).post("/api/partner-portal/staff").set("Cookie", cookie).send(validStaffBody);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, message: "Un utilisateur avec cet email existe déjà" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    createStaffMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/partner-portal/staff").set("Cookie", cookie).send(validStaffBody);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── PATCH /staff/:id/deactivate — PARTNER_ADMIN uniquement ──────────────────
describe("PATCH /api/partner-portal/staff/:id/deactivate", () => {
  it("200 — un PARTNER_ADMIN désactive un membre du personnel de son partenaire", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    deactivateStaffMock.mockResolvedValueOnce({ id: "staff-1", isActive: false });

    const res = await request(app).patch("/api/partner-portal/staff/staff-1/deactivate").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(deactivateStaffMock).toHaveBeenCalledWith("staff-1", "partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/staff/staff-1/deactivate");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("403 — refuse l'accès à un PARTNER_STAFF (réservé aux administrateurs partenaires)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app).patch("/api/partner-portal/staff/staff-1/deactivate").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès réservé aux administrateurs partenaires" });
    expect(deactivateStaffMock).not.toHaveBeenCalled();
  });

  it("404 — isolation multi-tenant : membre du personnel d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    deactivateStaffMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app).patch("/api/partner-portal/staff/staff-dun-autre-partenaire/deactivate").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("500 — propage une erreur inattendue du service", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    deactivateStaffMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).patch("/api/partner-portal/staff/staff-1/deactivate").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── POST /offers/:id/image ────────────────────────────────────────────────
describe("POST /api/partner-portal/offers/image", () => {
  it("200 — upload une image et retourne son URL (indépendant de toute offre existante, pour permettre l'image dès la création)", async () => {
    const cookie = withPartnerSession();
    uploadOfferImageMock.mockResolvedValueOnce({ imageUrl: "https://res.cloudinary.com/afrikcse/offers/photo.jpg" });

    const res = await request(app)
      .post("/api/partner-portal/offers/image")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-image-bytes"), "photo.jpg");

    expect(res.status).toBe(200);
    expect(res.body.imageUrl).toContain("cloudinary");
    expect(uploadOfferImageMock).toHaveBeenCalledWith("partner-1", expect.any(Buffer));
  });

  it("400 — rejette l'absence de fichier", async () => {
    const cookie = withPartnerSession();

    const res = await request(app).post("/api/partner-portal/offers/image").set("Cookie", cookie);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Aucun fichier fourni" });
    expect(uploadOfferImageMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un format de fichier non supporté (multer fileFilter)", async () => {
    const cookie = withPartnerSession();

    const res = await request(app)
      .post("/api/partner-portal/offers/image")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("pas-une-image"), "document.txt");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/format d'image non supporté/i);
    expect(uploadOfferImageMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app)
      .post("/api/partner-portal/offers/image")
      .attach("file", Buffer.from("fake-image-bytes"), "photo.jpg");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("500 — propage une erreur inattendue (ex. échec Cloudinary)", async () => {
    const cookie = withPartnerSession();
    uploadOfferImageMock.mockRejectedValueOnce(new Error("Échec de l'upload"));

    const res = await request(app)
      .post("/api/partner-portal/offers/image")
      .set("Cookie", cookie)
      .attach("file", Buffer.from("fake-image-bytes"), "photo.jpg");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

// ── GET /settings ──────────────────────────────────────────────────────────
describe("GET /api/partner-portal/settings", () => {
  it("200 — retourne les paramètres du partenaire authentifié, sans la clé API en clair", async () => {
    const cookie = withPartnerSession();
    getSettingsMock.mockResolvedValueOnce({
      currencyCode: "XOF", apiEnabled: false, apiBaseUrl: null, apiFormat: null,
      hasApiKey: true, paymentMethods: [],
    });

    const res = await request(app).get("/api/partner-portal/settings").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.hasApiKey).toBe(true);
    expect(res.body.apiKeyEncrypted).toBeUndefined();
    expect(getSettingsMock).toHaveBeenCalledWith("partner-1");
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/partner-portal/settings");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });

  it("accessible à un PARTNER_STAFF (lecture seule, pas réservée aux admins)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });
    getSettingsMock.mockResolvedValueOnce({ currencyCode: "XOF", apiEnabled: false, hasApiKey: false, paymentMethods: [] });

    const res = await request(app).get("/api/partner-portal/settings").set("Cookie", cookie);

    expect(res.status).toBe(200);
  });
});

// ── PATCH /settings/currency — PARTNER_ADMIN uniquement ──────────────────────
describe("PATCH /api/partner-portal/settings/currency", () => {
  it("200 — un PARTNER_ADMIN met à jour la devise", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    updateCurrencyMock.mockResolvedValueOnce({ currencyCode: "GHS" });

    const res = await request(app)
      .patch("/api/partner-portal/settings/currency")
      .set("Cookie", cookie)
      .send({ currencyCode: "GHS" });

    expect(res.status).toBe(200);
    expect(updateCurrencyMock).toHaveBeenCalledWith("partner-1", "GHS");
  });

  it("400 — rejette une devise non supportée", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });

    const res = await request(app)
      .patch("/api/partner-portal/settings/currency")
      .set("Cookie", cookie)
      .send({ currencyCode: "USD_FAKE" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.currencyCode).toBeDefined();
    expect(updateCurrencyMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un PARTNER_STAFF (réservé aux administrateurs partenaires)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app)
      .patch("/api/partner-portal/settings/currency")
      .set("Cookie", cookie)
      .send({ currencyCode: "XOF" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès réservé aux administrateurs partenaires" });
    expect(updateCurrencyMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/settings/currency").send({ currencyCode: "XOF" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });
});

// ── PATCH /settings/api-integration — PARTNER_ADMIN uniquement ───────────────
describe("PATCH /api/partner-portal/settings/api-integration", () => {
  it("200 — un PARTNER_ADMIN configure l'intégration API sans exposer la clé en retour", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    updateApiIntegrationMock.mockResolvedValueOnce({
      apiEnabled: true, apiBaseUrl: "https://api.partenaire.com", apiFormat: "JSON", hasApiKey: true,
    });

    const res = await request(app)
      .patch("/api/partner-portal/settings/api-integration")
      .set("Cookie", cookie)
      .send({ apiEnabled: true, apiBaseUrl: "https://api.partenaire.com", apiFormat: "JSON", apiKey: "un-secret-tres-long" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ apiEnabled: true, apiBaseUrl: "https://api.partenaire.com", apiFormat: "JSON", hasApiKey: true });
    expect(JSON.stringify(res.body)).not.toContain("un-secret-tres-long");
  });

  it("400 — rejette une apiBaseUrl mal formée", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });

    const res = await request(app)
      .patch("/api/partner-portal/settings/api-integration")
      .set("Cookie", cookie)
      .send({ apiBaseUrl: "pas-une-url" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.apiBaseUrl).toBeDefined();
    expect(updateApiIntegrationMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un PARTNER_STAFF (réservé aux administrateurs partenaires)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app)
      .patch("/api/partner-portal/settings/api-integration")
      .set("Cookie", cookie)
      .send({ apiEnabled: true });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: "Accès réservé aux administrateurs partenaires" });
    expect(updateApiIntegrationMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/settings/api-integration").send({ apiEnabled: true });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });
});

// ── Moyens de réception de paiement — PARTNER_ADMIN uniquement ───────────────
describe("GET /api/partner-portal/settings/payment-methods", () => {
  it("200 — un PARTNER_ADMIN liste les moyens de paiement sans jamais voir le détail chiffré", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    listPaymentMethodsMock.mockResolvedValueOnce([
      { id: "pm-1", type: "MOBILE_MONEY", provider: "Orange Money", label: "Compte principal", maskedHint: "•••• 4821", isActive: true },
    ]);

    const res = await request(app).get("/api/partner-portal/settings/payment-methods").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body[0].maskedHint).toBe("•••• 4821");
    expect(JSON.stringify(res.body)).not.toMatch(/detailsEncrypted/i);
  });

  it("403 — refuse l'accès à un PARTNER_STAFF", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app).get("/api/partner-portal/settings/payment-methods").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(listPaymentMethodsMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).get("/api/partner-portal/settings/payment-methods");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });
});

describe("POST /api/partner-portal/settings/payment-methods", () => {
  const validPaymentMethodBody = {
    type: "MOBILE_MONEY", provider: "Orange Money", label: "Compte principal",
    details: { numero: "+229 90 00 00 00" },
  };

  it("201 — un PARTNER_ADMIN ajoute un moyen de paiement", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN", partnerUserId: "admin-1" });
    createPaymentMethodMock.mockResolvedValueOnce({ id: "pm-1", ...validPaymentMethodBody, maskedHint: "•••• 0000", isActive: true });

    const res = await request(app)
      .post("/api/partner-portal/settings/payment-methods")
      .set("Cookie", cookie)
      .send(validPaymentMethodBody);

    expect(res.status).toBe(201);
    expect(createPaymentMethodMock).toHaveBeenCalledWith("partner-1", "admin-1", expect.objectContaining({ provider: "Orange Money" }));
  });

  it("400 — rejette un corps invalide (details vide)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });

    const res = await request(app)
      .post("/api/partner-portal/settings/payment-methods")
      .set("Cookie", cookie)
      .send({ ...validPaymentMethodBody, details: {} });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.details).toBeDefined();
    expect(createPaymentMethodMock).not.toHaveBeenCalled();
  });

  it("403 — refuse l'accès à un PARTNER_STAFF", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app)
      .post("/api/partner-portal/settings/payment-methods")
      .set("Cookie", cookie)
      .send(validPaymentMethodBody);

    expect(res.status).toBe(403);
    expect(createPaymentMethodMock).not.toHaveBeenCalled();
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).post("/api/partner-portal/settings/payment-methods").send(validPaymentMethodBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });
});

describe("PATCH /api/partner-portal/settings/payment-methods/:id", () => {
  it("200 — un PARTNER_ADMIN désactive un moyen de paiement de son partenaire", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    updatePaymentMethodMock.mockResolvedValueOnce({ id: "pm-1", isActive: false });

    const res = await request(app)
      .patch("/api/partner-portal/settings/payment-methods/pm-1")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(updatePaymentMethodMock).toHaveBeenCalledWith("pm-1", "partner-1", expect.objectContaining({ isActive: false }));
  });

  it("403 — refuse l'accès à un PARTNER_STAFF", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app)
      .patch("/api/partner-portal/settings/payment-methods/pm-1")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(403);
    expect(updatePaymentMethodMock).not.toHaveBeenCalled();
  });

  it("404 — isolation multi-tenant : moyen de paiement d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    updatePaymentMethodMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app)
      .patch("/api/partner-portal/settings/payment-methods/pm-dun-autre-partenaire")
      .set("Cookie", cookie)
      .send({ isActive: false });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).patch("/api/partner-portal/settings/payment-methods/pm-1").send({ isActive: false });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });
});

describe("DELETE /api/partner-portal/settings/payment-methods/:id", () => {
  it("204 — un PARTNER_ADMIN supprime un moyen de paiement de son partenaire", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    deletePaymentMethodMock.mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/partner-portal/settings/payment-methods/pm-1").set("Cookie", cookie);

    expect(res.status).toBe(204);
    expect(deletePaymentMethodMock).toHaveBeenCalledWith("pm-1", "partner-1");
  });

  it("403 — refuse l'accès à un PARTNER_STAFF", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_STAFF" });

    const res = await request(app).delete("/api/partner-portal/settings/payment-methods/pm-1").set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(deletePaymentMethodMock).not.toHaveBeenCalled();
  });

  it("404 — isolation multi-tenant : moyen de paiement d'un AUTRE partenaire (anti-IDOR)", async () => {
    const cookie = withPartnerSession({ role: "PARTNER_ADMIN" });
    deletePaymentMethodMock.mockRejectedValueOnce(foreignOrMissingResourceError());

    const res = await request(app).delete("/api/partner-portal/settings/payment-methods/pm-dun-autre-partenaire").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Ressource introuvable" });
  });

  it("401 — rejette une requête sans cookie de session partenaire", async () => {
    const res = await request(app).delete("/api/partner-portal/settings/payment-methods/pm-1");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token partenaire manquant" });
  });
});
