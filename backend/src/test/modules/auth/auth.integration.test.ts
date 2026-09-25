import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request, { Response } from "supertest";
import jwt from "jsonwebtoken";
import type { DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

jest.mock("../../../core/config/prisma");
jest.mock("../../../core/services/email.service");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import app from "../../../app";
import { prisma } from "../../../core/config/prisma";
import { sendMail } from "../../../core/services/email.service";
import { hashPassword, comparePassword, hashToken } from "../../../core/utils/hash";
import { installInMemoryPrisma, InMemoryDb } from "../../in-memory-prisma";

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
const sendMailMock = sendMail as jest.Mock;

// ── Jeu de données ───────────────────────────────────────────────────────────
const SUPER_ADMIN = { email: "superadmin@waxeho.com", password: "SuperAdmin123" };

const COMPANY = {
  companyName: "Acme Logistique",
  businessEmail: "contact@acme-logistique.ci",
  country: "CI",
  phone: "+2250700000000",
  size: "51-200",
  industry: "Transport",
  plan: "BUSINESS",
  requestVoyage: true,
  requestCSE: true,
  adminFirstName: "Awa",
  adminLastName: "Koné",
  email: "awa.kone@acme-logistique.ci",
  adminPassword: "AdminPass123",
};

const EMPLOYEE = {
  email: "kofi.mensah@acme-logistique.ci",
  firstName: "Kofi",
  lastName: "Mensah",
  role: "EMPLOYE",
  jobTitle: "Chargé de clientèle",
  department: "Commercial",
};
const EMPLOYEE_PASSWORD = "EmployePass123";

const PARTNER = {
  name: "Safari Lodge",
  sector: "Hôtellerie",
  contactEmail: "contact@safari-lodge.tg",
  websiteUrl: "https://safari-lodge.tg",
  scopeType: "CSE",
};
const PARTNER_PASSWORD = "PartnerPass123";

// ── Helpers ──────────────────────────────────────────────────────────────────

// extraire et parser les cookies renvoyés par votre serveur dans une réponse HTTP
function readCookies(res: Response): Record<string, string> {
  const header = res.headers["set-cookie"] as unknown as string[] | string | undefined;
  const list = Array.isArray(header) ? header : header ? [header] : [];
  return Object.fromEntries(
    list.map((cookie) => {
      const [pair] = cookie.split(";");
      const separator = pair.indexOf("=");
      return [pair.slice(0, separator), decodeURIComponent(pair.slice(separator + 1))];
    })
  );
}

/** Décode ET vérifie la signature d'un JWT émis par l'app. */
function verifyJwt(token: string): jwt.JwtPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
}

/**
 * Token brut du lien d'activation envoyé par email à `recipient` — à appeler
 * dans le même `it` que la requête qui envoie l'email (`clearMocks: true`
 * vide l'historique du mock entre deux tests).
 */
// intercepter et extraire le token d'activation secret qui a été envoyé par e-mail à un utilisateur.
function activationTokenSentTo(recipient: string): string {
  const mail = sendMailMock.mock.calls
    .map(([options]) => options as { to: string | string[]; html: string })
    .find((options) => options.to === recipient && /\/activate\?token=/.test(options.html));
  if (!mail) throw new Error(`Aucun email d'activation envoyé à ${recipient}`);
  return mail.html.match(/\/activate\?token=([a-f0-9]{64})/)![1];
}

function login(email: string, password: string) {
  return request(app).post("/api/auth/login").send({ email, password });
}

// ── État partagé ─────────────────────────────────────────────────────────────
let db: InMemoryDb;
let superAdminId: string;
let superAdminCookie: string[];

beforeAll(async () => {
  db = installInMemoryPrisma(prismaMock);

  // Organisation hôte (Waxeho) + SUPER_ADMIN, comme après le seed de production.
  const hostOrg = db.insert("organization", {
    name: "Waxeho", slug: "waxeho", status: "ACTIVE", isHost: true, hasVoyage: true, hasCSE: true,
  });
  superAdminId = db.insert("user", {
    email: SUPER_ADMIN.email,
    password: await hashPassword(SUPER_ADMIN.password),
    firstName: "Super",
    lastName: "Admin",
    role: "SUPER_ADMIN",
    organizationId: hostOrg.id,
    profileCompleted: true,
  }).id;

  // Le SUPER_ADMIN obtient sa session par le vrai login, pas par un token forgé.
  const res = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
  expect(res.status).toBe(200);
  superAdminCookie = [`accessToken=${readCookies(res).accessToken}`];
});

// ── 1. Entreprise & administrateur ───────────────────────────────────────────
describe("Parcours 1 — entreprise et administrateur", () => {
  let organizationId: string;
  let adminId: string;
  let adminCookie: string[];

  it("inscrit l'entreprise : organisation PENDING, admin rattaché, mot de passe haché", async () => {
    const res = await request(app).post("/api/auth/register-company").send(COMPANY);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: "Compte créé avec succès. En attente de validation par l'administrateur.",
      organizationId: expect.any(String),
    });
    organizationId = res.body.organizationId;

    expect(db.findOne("organization", { id: organizationId })).toMatchObject({
      name: COMPANY.companyName,
      slug: "acme-logistique",
      status: "PENDING",
      plan: "BUSINESS",
      // Modules seulement DEMANDÉS à l'inscription — activés par le SUPER_ADMIN.
      hasVoyage: false,
      hasCSE: false,
    });

    const admin = db.findOne("user", { email: COMPANY.email })!;
    expect(admin).toMatchObject({ role: "ADMIN", organizationId, isActive: true });
    expect(admin.password).not.toBe(COMPANY.adminPassword);
    expect(await comparePassword(COMPANY.adminPassword, admin.password)).toBe(true);
    adminId = admin.id;

    // Accusé de réception à l'admin + notification aux SUPER_ADMIN.
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: COMPANY.email }));
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: expect.arrayContaining([SUPER_ADMIN.email]) })
    );
  });

  it("refuse la connexion de l'admin tant que l'organisation est en attente de validation", async () => {
    const res = await login(COMPANY.email, COMPANY.adminPassword);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Votre organisation est en attente de validation." });
    expect(readCookies(res)).not.toHaveProperty("accessToken");
    expect(db.findAll("userSession", { userId: adminId })).toHaveLength(0);
  });

  it("le SUPER_ADMIN valide l'organisation et active les modules", async () => {
    const res = await request(app)
      .patch(`/api/organizations/${organizationId}/validate`)
      .set("Cookie", superAdminCookie)
      .send({ hasVoyage: true, hasCSE: true });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Organisation validée");
    expect(res.body.org).toMatchObject({
      id: organizationId,
      status: "ACTIVE",
      hasVoyage: true,
      hasCSE: true,
      validatedById: superAdminId,
    });
    // Email de confirmation à l'admin (PlatformSettings.notifyOnValidation = true par défaut).
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({ to: COMPANY.email }));
  });

  it("connecte l'admin : cookies de session posés et JWT conforme", async () => {
    const res = await login(COMPANY.email, COMPANY.adminPassword);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      type: "user",
      sessionToken: expect.any(String),
      user: {
        id: adminId,
        email: COMPANY.email,
        role: "ADMIN",
        organizationId,
        organization: { id: organizationId, name: COMPANY.companyName, hasVoyage: true, hasCSE: true, isHost: false },
      },
    });
    expect(res.body.user).not.toHaveProperty("password");

    const cookies = readCookies(res);
    expect(cookies).toEqual(expect.objectContaining({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      csrfToken: expect.any(String),
    }));
    expect(cookies).not.toHaveProperty("partnerAccessToken");

    expect(verifyJwt(cookies.accessToken)).toMatchObject({
      userId: adminId,
      role: "ADMIN",
      organizationId,
      isHost: false,
      tokenVersion: 0,
      type: "access",
    });

    // Une session par appareil, qui ne stocke que le HASH du refresh token.
    const sessions = db.findAll("userSession", { userId: adminId });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].refreshTokenHash).toBe(hashToken(cookies.refreshToken));

    adminCookie = [`accessToken=${cookies.accessToken}`];
  });

  it("récupère le profil de l'admin connecté (GET /api/auth/me)", async () => {
    const res = await request(app).get("/api/auth/me").set("Cookie", adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({
      id: adminId,
      email: COMPANY.email,
      firstName: COMPANY.adminFirstName,
      lastName: COMPANY.adminLastName,
      avatar: null,
      role: "ADMIN",
      profileCompleted: false,
      organizationId,
      organization: {
        id: organizationId,
        name: COMPANY.companyName,
        hasVoyage: true,
        hasCSE: true,
        isHost: false,
        status: "ACTIVE",
        logoUrl: null,
        primaryColor: null,
        secondaryColor: null,
      },
    });
  });

  // ── 2. Employé (dépend de l'admin connecté ci-dessus) ─────────────────────
  describe("Parcours 2 — employé", () => {
    let employeeId: string;
    let activationToken: string;
    let employeeCookie: string[];

    it("l'admin ajoute un employé : réponse sans données sensibles, invitation envoyée", async () => {
      const res = await request(app).post("/api/users").set("Cookie", adminCookie).send(EMPLOYEE);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        email: EMPLOYEE.email,
        firstName: EMPLOYEE.firstName,
        lastName: EMPLOYEE.lastName,
        role: "EMPLOYE",
        jobTitle: EMPLOYEE.jobTitle,
        department: EMPLOYEE.department,
        organizationId,
        isActive: true,
      });
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("resetPasswordToken");
      expect(res.body).not.toHaveProperty("resetPasswordExpiresAt");
      employeeId = res.body.id;

      // L'email porte le token brut ; la base n'en garde que le hash.
      activationToken = activationTokenSentTo(EMPLOYEE.email);
      expect(db.findOne("user", { id: employeeId })!.resetPasswordToken).toBe(hashToken(activationToken));
    });

    it("refuse la connexion de l'employé avant l'activation de son compte", async () => {
      const res = await login(EMPLOYEE.email, EMPLOYEE_PASSWORD);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Email ou mot de passe incorrect" });
    });

    it("active le compte via le lien d'invitation en définissant le mot de passe", async () => {
      const res = await request(app)
        .post("/api/auth/activate")
        .send({ token: activationToken, password: EMPLOYEE_PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Compte activé avec succès. Vous pouvez maintenant vous connecter.",
      });

      const employee = db.findOne("user", { id: employeeId })!;
      expect(employee.resetPasswordToken).toBeNull();
      expect(employee.resetPasswordExpiresAt).toBeNull();
      expect(await comparePassword(EMPLOYEE_PASSWORD, employee.password)).toBe(true);
    });

    it("refuse de réutiliser le lien d'activation (usage unique)", async () => {
      const res = await request(app)
        .post("/api/auth/activate")
        .send({ token: activationToken, password: "AutreMotDePasse123" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Lien invalide ou expiré" });
    });

    it("connecte l'employé : JWT conforme à son rôle et à son organisation", async () => {
      const res = await login(EMPLOYEE.email, EMPLOYEE_PASSWORD);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        type: "user",
        user: { id: employeeId, email: EMPLOYEE.email, role: "EMPLOYE", organizationId },
      });

      const { accessToken } = readCookies(res);
      expect(verifyJwt(accessToken)).toMatchObject({
        userId: employeeId,
        role: "EMPLOYE",
        organizationId,
        isHost: false,
        // L'activation révoque les sessions antérieures en incrémentant tokenVersion.
        tokenVersion: db.findOne("user", { id: employeeId })!.tokenVersion,
        type: "access",
      });

      employeeCookie = [`accessToken=${accessToken}`];
    });

    it("récupère le profil de l'employé (session + espace employé)", async () => {
      const me = await request(app).get("/api/auth/me").set("Cookie", employeeCookie);

      expect(me.status).toBe(200);
      expect(me.body.user).toMatchObject({
        id: employeeId,
        email: EMPLOYEE.email,
        role: "EMPLOYE",
        organizationId,
        organization: { id: organizationId, name: COMPANY.companyName, status: "ACTIVE" },
      });

      const profile = await request(app).get("/api/employee/profile").set("Cookie", employeeCookie);

      expect(profile.status).toBe(200);
      expect(profile.body).toMatchObject({
        id: employeeId,
        email: EMPLOYEE.email,
        firstName: EMPLOYEE.firstName,
        lastName: EMPLOYEE.lastName,
        role: "EMPLOYE",
        jobTitle: EMPLOYEE.jobTitle,
        department: EMPLOYEE.department,
        isActive: true,
        organizationId,
        organization: { name: COMPANY.companyName },
        lastLoginAt: expect.any(String),
      });
      expect(profile.body).not.toHaveProperty("password");
      expect(profile.body).not.toHaveProperty("resetPasswordToken");
    });
  });
});

// ── 3. Partenaire ────────────────────────────────────────────────────────────
describe("Parcours 3 — partenaire", () => {
  let partnerId: string;
  let partnerUserId: string;
  let activationToken: string;
  let partnerCookie: string[];

  it("le SUPER_ADMIN crée le partenaire : statut DRAFT et compte PARTNER_ADMIN amorcé", async () => {
    const res = await request(app).post("/api/partners").set("Cookie", superAdminCookie).send(PARTNER);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: PARTNER.name,
      sector: PARTNER.sector,
      contactEmail: PARTNER.contactEmail,
      status: "DRAFT",
      createdBy: superAdminId,
      activationLink: expect.stringContaining("/activate?token="),
    });
    partnerId = res.body.id;

    const partnerUser = db.findOne("partnerUser", { email: PARTNER.contactEmail })!;
    expect(partnerUser).toMatchObject({ partnerId, role: "PARTNER_ADMIN", isActive: true });
    partnerUserId = partnerUser.id;

    activationToken = activationTokenSentTo(PARTNER.contactEmail);
    expect(res.body.activationLink).toContain(activationToken);
    expect(partnerUser.resetPasswordToken).toBe(hashToken(activationToken));
  });

  it("le partenaire active son compte via le lien, alors qu'il est encore en DRAFT", async () => {
    const res = await request(app)
      .post("/api/auth/activate")
      .send({ token: activationToken, password: PARTNER_PASSWORD });

    expect(res.status).toBe(200);

    const partnerUser = db.findOne("partnerUser", { id: partnerUserId })!;
    expect(partnerUser.resetPasswordToken).toBeNull();
    expect(await comparePassword(PARTNER_PASSWORD, partnerUser.passwordHash)).toBe(true);
    expect(db.findOne("partner", { id: partnerId })!.status).toBe("DRAFT");
  });

  it("refuse la connexion tant que le partenaire est en DRAFT", async () => {
    const res = await login(PARTNER.contactEmail, PARTNER_PASSWORD);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Votre compte partenaire est en attente de validation." });
    const cookies = readCookies(res);
    expect(cookies).not.toHaveProperty("partnerAccessToken");
    expect(cookies).not.toHaveProperty("accessToken");

    // Le statut n'est révélé qu'avec le bon mot de passe (pas d'énumération de comptes).
    const wrongPassword = await login(PARTNER.contactEmail, "MauvaisMotDePasse1");
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual({ message: "Email ou mot de passe incorrect" });
  });

  it("le SUPER_ADMIN valide le partenaire (DRAFT → ACTIVE)", async () => {
    const res = await request(app)
      .patch(`/api/partners/${partnerId}`)
      .set("Cookie", superAdminCookie)
      .send({ status: "ACTIVE" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: partnerId, status: "ACTIVE", hasApiKey: false });
  });

  it("connecte le partenaire via le login unifié : session partenaire uniquement, JWT conforme", async () => {
    const res = await login(PARTNER.contactEmail, PARTNER_PASSWORD);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      type: "partner",
      partnerUser: {
        id: partnerUserId,
        email: PARTNER.contactEmail,
        firstName: "Administrateur",
        lastName: PARTNER.name,
        role: "PARTNER_ADMIN",
        partnerId,
        partnerName: PARTNER.name,
        partnerLogoUrl: null,
      },
    });

    // Les deux systèmes de session restent étanches : aucun cookie User posé.
    const cookies = readCookies(res);
    expect(cookies).toEqual(expect.objectContaining({
      partnerAccessToken: expect.any(String),
      partnerRefreshToken: expect.any(String),
    }));
    expect(cookies).not.toHaveProperty("accessToken");
    expect(cookies).not.toHaveProperty("refreshToken");

    const partnerUser = db.findOne("partnerUser", { id: partnerUserId })!;
    expect(verifyJwt(cookies.partnerAccessToken)).toMatchObject({
      partnerUserId,
      partnerId,
      role: "PARTNER_ADMIN",
      tokenVersion: partnerUser.tokenVersion,
      type: "access",
    });
    expect(partnerUser.refreshToken).toBe(hashToken(cookies.partnerRefreshToken));
    expect(partnerUser.lastLoginAt).toBeInstanceOf(Date);

    partnerCookie = [`partnerAccessToken=${cookies.partnerAccessToken}`];
  });

  it("récupère la session et le profil complet du partenaire connecté", async () => {
    const me = await request(app).get("/api/partner-portal/me").set("Cookie", partnerCookie);

    expect(me.status).toBe(200);
    expect(me.body.user).toEqual({
      id: partnerUserId,
      email: PARTNER.contactEmail,
      firstName: "Administrateur",
      lastName: PARTNER.name,
      role: "PARTNER_ADMIN",
      partnerId,
      partnerName: PARTNER.name,
      partnerLogoUrl: null,
    });

    const profile = await request(app).get("/api/partner-portal/profile").set("Cookie", partnerCookie);

    expect(profile.status).toBe(200);
    expect(profile.body).toMatchObject({
      id: partnerId,
      name: PARTNER.name,
      sector: PARTNER.sector,
      contactEmail: PARTNER.contactEmail,
      websiteUrl: PARTNER.websiteUrl,
      status: "ACTIVE",
      scopeType: "CSE",
      currencyCode: "XOF",
      locations: [],
    });
    // Champs réservés au SUPER_ADMIN ou secrets chiffrés : jamais exposés au partenaire.
    for (const field of ["notes", "apiKeyEncrypted", "partnerToken", "mobileMoneyNumberEncrypted", "bankDetailsEncrypted", "warningCount"]) {
      expect(profile.body).not.toHaveProperty(field);
    }
  });
});
