import { jest, describe, it, expect, beforeEach } from "@jest/globals";

type StatutOrganisation = "ACTIVE" | "PENDING" | "SUSPENDED";

type Organisation = {
  id: string;
  name: string;
  status: StatutOrganisation;
  hasVoyage: boolean;
  hasCSE: boolean;
  isHost: boolean;
};

type Utilisateur = {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  tokenVersion: number;
  profileCompleted: boolean;
  organizationId: string;
  organization: Organisation;
};

type LoginDto = { email: string; password: string };

type ContexteConnexion = { userAgent?: string; ipAddress?: string };

type DonneesSession = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

const mocks = {
  findUserByEmail: jest.fn<(email: string) => Promise<Utilisateur | null>>(),
  createSession: jest.fn<(donnees: DonneesSession) => Promise<{ id: string }>>(),
  updateLastLogin: jest.fn<(userId: string) => Promise<void>>(),
  partnerLogin: jest.fn<(dto: LoginDto, contexte?: ContexteConnexion) => Promise<unknown>>(),
  comparePassword: jest.fn<(motDePasseClair: string, hash: string) => Promise<boolean>>(),
  hashToken: jest.fn<(token: string) => string>(),
  signAccessToken: jest.fn<(payload: unknown) => string>(),
  signRefreshToken: jest.fn<(payload: unknown) => string>(),
  verifyRefreshToken: jest.fn<(token: string) => unknown>(),
};

jest.mock("../../../modules/auth/infrastructure/auth.repository", () => ({
  AuthRepository: jest.fn(() => ({
    findUserByEmail: (...args: Parameters<typeof mocks.findUserByEmail>) =>
      mocks.findUserByEmail(...args),
    createSession: (...args: Parameters<typeof mocks.createSession>) =>
      mocks.createSession(...args),
    updateLastLogin: (...args: Parameters<typeof mocks.updateLastLogin>) =>
      mocks.updateLastLogin(...args),
  })),
}));

jest.mock("../../../modules/partner-portal/application/partner-portal.service", () => ({
  PartnerPortalService: jest.fn(() => ({
    login: (...args: Parameters<typeof mocks.partnerLogin>) => mocks.partnerLogin(...args),
  })),
}));

jest.mock("../../../core/utils/hash", () => ({
  comparePassword: (...args: Parameters<typeof mocks.comparePassword>) =>
    mocks.comparePassword(...args),
  hashToken: (...args: Parameters<typeof mocks.hashToken>) => mocks.hashToken(...args),
  hashPassword: jest.fn(),
}));

jest.mock("../../../core/utils/jwt", () => ({
  signAccessToken: (...args: Parameters<typeof mocks.signAccessToken>) =>
    mocks.signAccessToken(...args),
  signRefreshToken: (...args: Parameters<typeof mocks.signRefreshToken>) =>
    mocks.signRefreshToken(...args),
  verifyRefreshToken: (...args: Parameters<typeof mocks.verifyRefreshToken>) =>
    mocks.verifyRefreshToken(...args),
  REFRESH_TOKEN_TTL_MS: 30 * 24 * 60 * 60 * 1000,
}));

jest.mock("../../../core/services/email.service");

jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { AuthService } from "../../../modules/auth/application/auth.service";

const service = new AuthService();

const utilisateurEnBase: Utilisateur = {
  id: "user-1",
  email: "jean.dupont@acme.com",
  password: "$2b$10$hash-bcrypt-fictif",
  firstName: "Jean",
  lastName: "Dupont",
  role: "ADMIN",
  isActive: true,
  tokenVersion: 1,
  profileCompleted: true,
  organizationId: "org-1",
  organization: {
    id: "org-1",
    name: "Acme",
    status: "ACTIVE",
    hasVoyage: true,
    hasCSE: false,
    isHost: false,
  },
};

const dto: LoginDto = { email: "jean.dupont@acme.com", password: "Password123" };

const capturerErreur = async (executer: () => Promise<unknown>): Promise<Error> => {
  try {
    await executer();
  } catch (erreur) {
    return erreur as Error;
  }
  throw new Error("L'appel aurait dû être rejeté, mais il a réussi.");
};

beforeEach(() => {
  jest.clearAllMocks();

  // Comportements par défaut du « chemin heureux ».
  mocks.hashToken.mockReturnValue("sha256-du-refresh");
  mocks.signAccessToken.mockReturnValue("access-token-1");
  mocks.signRefreshToken.mockReturnValue("refresh-token-1");
  mocks.createSession.mockResolvedValue({ id: "session-1" });
  mocks.updateLastLogin.mockResolvedValue(undefined);
});

describe("AuthService.login", () => {
  it("authentifie l'utilisateur, ouvre une session et renvoie les jetons", async () => {
    mocks.findUserByEmail.mockResolvedValue(utilisateurEnBase);
    mocks.comparePassword.mockResolvedValue(true);

    const resultat = await service.login(dto, { userAgent: "Chrome", ipAddress: "1.2.3.4" });
    expect(mocks.findUserByEmail).toHaveBeenCalledWith(dto.email);
    expect(mocks.comparePassword).toHaveBeenCalledWith(dto.password, utilisateurEnBase.password);
    expect(mocks.partnerLogin).not.toHaveBeenCalled();
    expect(mocks.signAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.signRefreshToken).toHaveBeenCalledTimes(1);
    expect(mocks.createSession).toHaveBeenCalledTimes(1);
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: utilisateurEnBase.id,
        refreshTokenHash: "sha256-du-refresh",
        userAgent: "Chrome",
        ipAddress: "1.2.3.4",
      }),
    );
    expect(mocks.updateLastLogin).toHaveBeenCalledWith(utilisateurEnBase.id);
    expect(resultat).toMatchObject({
      accessToken: "access-token-1",
      refreshToken: "refresh-token-1",
      user: {
        id: "user-1",
        email: "jean.dupont@acme.com",
        role: "ADMIN",
        organizationId: "org-1",
      },
    });
  });

  it("renvoie le même message pour un email inconnu et pour un mot de passe faux", async () => {
    mocks.findUserByEmail.mockResolvedValueOnce(null);
    mocks.partnerLogin.mockRejectedValueOnce(new Error("Identifiants partenaire invalides"));
    const erreurEmailInconnu = await capturerErreur(() =>
      service.login({ ...dto, email: "inconnu@acme.com" }),
    );

    mocks.findUserByEmail.mockResolvedValueOnce(utilisateurEnBase);
    mocks.comparePassword.mockResolvedValueOnce(false);
    const erreurMauvaisMdp = await capturerErreur(() => service.login(dto));

    expect(erreurMauvaisMdp.message).toBe(erreurEmailInconnu.message);
    expect(erreurEmailInconnu.message).toBe("Email ou mot de passe incorrect");
  });

  it("ne persiste que le hash du refresh token dans la session, jamais le token brut", async () => {
    mocks.findUserByEmail.mockResolvedValueOnce(utilisateurEnBase);
    mocks.comparePassword.mockResolvedValueOnce(true);
    await service.login(dto, { userAgent: "Chrome", ipAddress: "1.2.3.4" });
    expect(mocks.hashToken).toHaveBeenCalledWith("refresh-token-1");
    const [argsSession] = mocks.createSession.mock.calls[0];
    expect(argsSession.refreshTokenHash).toBe("sha256-du-refresh");
    expect(JSON.stringify(argsSession)).not.toContain("refresh-token-1");
    expect(argsSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("n'ouvre aucune session quand l'organisation est en attente de validation", async () => {
    mocks.findUserByEmail.mockResolvedValueOnce({
      ...utilisateurEnBase,
      organization: { ...utilisateurEnBase.organization, status: "PENDING" },
    });
    mocks.comparePassword.mockResolvedValueOnce(true); // mot de passe correct
    await expect(service.login(dto)).rejects.toThrow(
      "Votre organisation est en attente de validation.",
    );
    expect(mocks.signAccessToken).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(mocks.updateLastLogin).not.toHaveBeenCalled();
  });

  it("ne fait pas fuiter le hash du mot de passe dans la charge utile retournée", async () => {
    mocks.findUserByEmail.mockResolvedValueOnce(utilisateurEnBase);
    mocks.comparePassword.mockResolvedValueOnce(true);
    const resultat = await service.login(dto);
    expect(resultat.user).not.toHaveProperty("password");
    expect(JSON.stringify(resultat.user)).not.toContain(utilisateurEnBase.password);
  });
});