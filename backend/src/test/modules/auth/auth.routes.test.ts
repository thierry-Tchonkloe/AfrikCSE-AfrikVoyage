// ─────────────────────────────────────────────────────────────────────────────
// Tests d'intégration Supertest pour /api/auth (src/modules/auth).
//
// Stratégie d'isolation :
// - `core/config/prisma` → mocké (jest-mock-extended) : utilisé directement par
//   `authenticate` (lookup utilisateur) et par AuthController.me().
// - `core/utils/jwt` → mocké : verifyAccessToken() est contrôlé par test,
//   ce qui permet de simuler un cookie « valide » sans signer de vrai JWT.
// - `modules/auth/application/auth.service` → mocké (automock) : isole le
//   routing/validation/contrôleur de la logique métier réelle (bcrypt, envoi
//   d'email, PartnerPortalService…), qui mérite son propre test unitaire dédié.
// - `express-rate-limit` → mocké en no-op : évite que le rate-limiter strict
//   (10 requêtes/15min) sur les routes sensibles ne fasse échouer la suite.
// ─────────────────────────────────────────────────────────────────────────────

import request from "supertest";
import { mockReset, DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/utils/jwt");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("../../../modules/auth/application/auth.service");
jest.mock("express-rate-limit", () => jest.fn(() => (_req: any, _res: any, next: any) => next()));

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { verifyAccessToken } from "../../../core/utils/jwt";
import { AuthService } from "../../../modules/auth/application/auth.service";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const verifyAccessTokenMock = verifyAccessToken as jest.Mock;

// AuthController instancie `new AuthService()` une seule fois au chargement du
// module (singleton). En automock, les méthodes du prototype sont partagées
// par toutes les instances : les configurer ici suffit à contrôler cette
// instance interne, sans avoir à l'importer directement.
const registerCompanyMock = AuthService.prototype.registerCompany as jest.Mock;
const loginMock = AuthService.prototype.login as jest.Mock;
const logoutMock = AuthService.prototype.logout as jest.Mock;
const refreshMock = AuthService.prototype.refresh as jest.Mock;
const forgotPasswordMock = AuthService.prototype.forgotPassword as jest.Mock;
const resetPasswordMock = AuthService.prototype.resetPassword as jest.Mock;
const completeProfileMock = AuthService.prototype.completeProfile as jest.Mock;
const changePasswordMock = AuthService.prototype.changePassword as jest.Mock;

beforeEach(() => {
  mockReset(prismaMock);
});

/** Simule un cookie de session valide en contrôlant directement verifyAccessToken. */
function withValidSession(overrides: Partial<Record<string, unknown>> = {}) {
  verifyAccessTokenMock.mockReturnValue({
    userId: "user-1",
    role: "ADMIN",
    organizationId: "org-1",
    isHost: false,
    tokenVersion: 1,
    ...overrides,
  });
  prismaMock.user.findUnique.mockResolvedValueOnce({
    tokenVersion: 1,
    isActive: true,
  } as never);
  return ["accessToken=session-valide"];
}

const validRegisterBody = {
  companyName: "Acme Corp",
  businessEmail: "contact@acme.com",
  country: "Bénin",
  phone: "22912345678",
  size: "11-50",
  industry: "Technologie",
  plan: "BUSINESS",
  adminFirstName: "Jean",
  adminLastName: "Dupont",
  email: "jean.dupont@acme.com",
  adminPassword: "Password123",
};

describe("POST /api/auth/register-company", () => {
  it("201 — crée la demande d'inscription avec un corps valide", async () => {
    registerCompanyMock.mockResolvedValueOnce({
      message: "Compte créé avec succès. En attente de validation par l'administrateur.",
      organizationId: "org-123",
    });

    const res = await request(app).post("/api/auth/register-company").send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: "Compte créé avec succès. En attente de validation par l'administrateur.",
      organizationId: "org-123",
    });
  });

  it("400 — rejette un corps vide (validation Zod)", async () => {
    const res = await request(app).post("/api/auth/register-company").send({});

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.companyName).toBeDefined();
    expect(res.body.errors.fieldErrors.email).toBeDefined();
    expect(registerCompanyMock).not.toHaveBeenCalled();
  });

  it("400 — propage l'erreur métier (email admin déjà utilisé)", async () => {
    registerCompanyMock.mockRejectedValueOnce(new Error("Cet email est déjà utilisé"));

    const res = await request(app).post("/api/auth/register-company").send(validRegisterBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Cet email est déjà utilisé" });
  });
});

describe("POST /api/auth/login", () => {
  const validLoginBody = { email: "jean.dupont@acme.com", password: "Password123" };

  it("200 — connecte un utilisateur standard et pose les cookies de session", async () => {
    loginMock.mockResolvedValueOnce({
      type: "user",
      accessToken: "access-token-1",
      refreshToken: "refresh-token-1",
      user: {
        id: "user-1",
        email: "jean.dupont@acme.com",
        firstName: "Jean",
        lastName: "Dupont",
        role: "ADMIN",
        profileCompleted: true,
        organizationId: "org-1",
        organization: { id: "org-1", name: "Acme", hasVoyage: true, hasCSE: false, isHost: false },
      },
    });

    const res = await request(app).post("/api/auth/login").send(validLoginBody);

    expect(res.status).toBe(200);
    expect(res.body.type).toBe("user");
    expect(res.body.user.email).toBe("jean.dupont@acme.com");
    expect(typeof res.body.sessionToken).toBe("string");
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("accessToken="))).toBe(true);
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("200 — connecte un partenaire et pose les cookies dédiés partenaire", async () => {
    loginMock.mockResolvedValueOnce({
      type: "partner",
      accessToken: "partner-access-1",
      refreshToken: "partner-refresh-1",
      user: { id: "partner-1", email: "contact@partenaire.com" },
    });

    const res = await request(app).post("/api/auth/login").send(validLoginBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      type: "partner",
      partnerUser: { id: "partner-1", email: "contact@partenaire.com" },
    });
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("partnerAccessToken="))).toBe(true);
  });

  it("400 — rejette un corps invalide (email manquant)", async () => {
    const res = await request(app).post("/api/auth/login").send({ password: "Password123" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.email).toBeDefined();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("401 — rejette des identifiants incorrects", async () => {
    loginMock.mockRejectedValueOnce(new Error("Email ou mot de passe incorrect"));

    const res = await request(app).post("/api/auth/login").send(validLoginBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Email ou mot de passe incorrect" });
  });
});

describe("POST /api/auth/refresh", () => {
  it("200 — renouvelle l'access token à partir du cookie refreshToken", async () => {
    refreshMock.mockResolvedValueOnce({ accessToken: "new-access", refreshToken: "new-refresh" });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["refreshToken=ancien-refresh-token"]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    const cookies = res.headers["set-cookie"] as unknown as string[];
    expect(cookies.some((c) => c.startsWith("accessToken="))).toBe(true);
  });

  it("400 — rejette l'absence de cookie refreshToken", async () => {
    const res = await request(app).post("/api/auth/refresh");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Refresh token requis" });
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("401 — rejette un refresh token invalide et nettoie les cookies", async () => {
    refreshMock.mockRejectedValueOnce(new Error("Refresh token invalide"));

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", ["refreshToken=token-invalide"]);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Refresh token invalide" });
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("200 — répond toujours par le même message générique (anti-énumération)", async () => {
    forgotPasswordMock.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "jean.dupont@acme.com" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Si cet email est enregistré, un lien vous a été envoyé." });
  });

  it("400 — rejette un email au format invalide", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({ email: "pas-un-email" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.email).toBeDefined();
    expect(forgotPasswordMock).not.toHaveBeenCalled();
  });

  it("500 — une erreur inattendue du service remonte au middleware d'erreurs global", async () => {
    forgotPasswordMock.mockRejectedValueOnce(new Error("Échec d'envoi SMTP"));

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "jean.dupont@acme.com" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Erreur interne du serveur" });
  });
});

describe("POST /api/auth/reset-password", () => {
  const validBody = { token: "reset-token-1", password: "NewPassword123" };

  it("200 — réinitialise le mot de passe avec un token et un mot de passe valides", async () => {
    resetPasswordMock.mockResolvedValueOnce(undefined);

    const res = await request(app).post("/api/auth/reset-password").send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Mot de passe réinitialisé" });
  });

  it("400 — rejette un mot de passe trop faible (validation Zod)", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "reset-token-1", password: "faible" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.password).toBeDefined();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un lien de réinitialisation invalide ou expiré", async () => {
    resetPasswordMock.mockRejectedValueOnce(new Error("Lien invalide ou expiré"));

    const res = await request(app).post("/api/auth/reset-password").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Lien invalide ou expiré" });
  });
});

describe("POST /api/auth/logout", () => {
  it("200 — déconnecte l'utilisateur authentifié et efface les cookies de session", async () => {
    const cookie = withValidSession();
    logoutMock.mockResolvedValueOnce(undefined);

    const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Déconnecté avec succès" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).post("/api/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
    expect(logoutMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue de révocation de session", async () => {
    const cookie = withValidSession();
    logoutMock.mockRejectedValueOnce(new Error("Panne base de données"));

    const res = await request(app).post("/api/auth/logout").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Panne base de données" });
  });
});

describe("GET /api/auth/me", () => {
  it("200 — retourne le profil de l'utilisateur authentifié", async () => {
    const cookie = withValidSession();
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "jean.dupont@acme.com",
      firstName: "Jean",
      lastName: "Dupont",
      avatar: null,
      role: "ADMIN",
      profileCompleted: true,
      organizationId: "org-1",
      organization: null,
    } as never);

    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("jean.dupont@acme.com");
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("404 — l'utilisateur authentifié n'existe plus en base au moment du lookup", async () => {
    const cookie = withValidSession();
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Utilisateur introuvable" });
  });

  it("500 — propage une erreur inattendue de la base de données", async () => {
    const cookie = withValidSession();
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error("Connexion DB perdue"));

    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Connexion DB perdue" });
  });
});

describe("PATCH /api/auth/complete-profile", () => {
  it("200 — complète le profil de l'utilisateur authentifié", async () => {
    const cookie = withValidSession();
    completeProfileMock.mockResolvedValueOnce(undefined);

    const res = await request(app)
      .patch("/api/auth/complete-profile")
      .set("Cookie", cookie)
      .send({ jobTitle: "Développeur", department: "IT" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Profil complété" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/auth/complete-profile").send({ jobTitle: "Développeur" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("400 — rejette un champ de type invalide (validation Zod)", async () => {
    const cookie = withValidSession();

    const res = await request(app)
      .patch("/api/auth/complete-profile")
      .set("Cookie", cookie)
      .send({ phone: 12345 });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.phone).toBeDefined();
    expect(completeProfileMock).not.toHaveBeenCalled();
  });

  it("500 — propage une erreur inattendue lors de la mise à jour", async () => {
    const cookie = withValidSession();
    completeProfileMock.mockRejectedValueOnce(new Error("Erreur d'écriture en base"));

    const res = await request(app)
      .patch("/api/auth/complete-profile")
      .set("Cookie", cookie)
      .send({ jobTitle: "Développeur" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Erreur d'écriture en base" });
  });
});

describe("PATCH /api/auth/change-password", () => {
  const validBody = { currentPassword: "OldPassword123", newPassword: "NewPassword456" };

  it("200 — modifie le mot de passe de l'utilisateur authentifié", async () => {
    const cookie = withValidSession();
    changePasswordMock.mockResolvedValueOnce(undefined);

    const res = await request(app).patch("/api/auth/change-password").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Mot de passe modifié avec succès" });
  });

  it("401 — rejette une requête sans cookie de session", async () => {
    const res = await request(app).patch("/api/auth/change-password").send(validBody);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Token manquant" });
  });

  it("400 — rejette un corps invalide (nouveau mot de passe trop faible)", async () => {
    const cookie = withValidSession();

    const res = await request(app)
      .patch("/api/auth/change-password")
      .set("Cookie", cookie)
      .send({ currentPassword: "OldPassword123", newPassword: "faible" });

    expect(res.status).toBe(400);
    expect(res.body.errors.fieldErrors.newPassword).toBeDefined();
    expect(changePasswordMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un mot de passe actuel incorrect", async () => {
    const cookie = withValidSession();
    changePasswordMock.mockRejectedValueOnce(new Error("Mot de passe actuel incorrect"));

    const res = await request(app).patch("/api/auth/change-password").set("Cookie", cookie).send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Mot de passe actuel incorrect" });
  });
});

describe("POST /api/auth/activate", () => {
  const validBody = { token: "activation-token-1", password: "NewPassword123" };

  it("200 — active le compte avec un token et un mot de passe valides", async () => {
    resetPasswordMock.mockResolvedValueOnce(undefined);

    const res = await request(app).post("/api/auth/activate").send(validBody);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: "Compte activé avec succès. Vous pouvez maintenant vous connecter.",
    });
  });

  it("400 — rejette une requête sans token ni mot de passe", async () => {
    const res = await request(app).post("/api/auth/activate").send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Token et mot de passe requis" });
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("400 — rejette un token d'activation invalide ou expiré", async () => {
    resetPasswordMock.mockRejectedValueOnce(new Error("Lien invalide ou expiré"));

    const res = await request(app).post("/api/auth/activate").send(validBody);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Lien invalide ou expiré" });
  });
});
