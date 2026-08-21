// import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// jest.mock("../../../modules/auth/infrastructure/auth.repository");
// jest.mock("../../../modules/partner-portal/application/partner-portal.service");
// jest.mock("../../../core/utils/hash");
// jest.mock("../../../core/services/email.service");
// jest.mock("../../../core/utils/logger", () => ({
//   logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
// }));

// jest.mock("../../../core/utils/jwt", () => ({
//   signAccessToken: jest.fn(() => "access-token-1"),
//   signRefreshToken: jest.fn(() => "refresh-token-1"),
//   verifyRefreshToken: jest.fn(),
//   REFRESH_TOKEN_TTL_MS: 30 * 24 * 60 * 60 * 1000,
// }));

// import { AuthService } from "../../../modules/auth/application/auth.service";
// import { AuthRepository } from "../../../modules/auth/infrastructure/auth.repository";
// import { PartnerPortalService } from "../../../modules/partner-portal/application/partner-portal.service";
// import { comparePassword, hashToken } from "../../../core/utils/hash";
// import { signAccessToken } from "../../../core/utils/jwt";


// const findUserByEmailMock = AuthRepository.prototype.findUserByEmail as jest.Mock;
// const createSessionMock = AuthRepository.prototype.createSession as jest.Mock;
// const updateLastLoginMock = AuthRepository.prototype.updateLastLogin as jest.Mock;
// const partnerLoginMock = PartnerPortalService.prototype.login as jest.Mock;
// const comparePasswordMock = comparePassword as jest.Mock;
// const hashTokenMock = hashToken as jest.Mock;

// const service = new AuthService();



// const utilisateurEnBase = {
//   id: "user-1",
//   email: "jean.dupont@acme.com",
//   password: "$2b$10$hash-bcrypt-fictif",
//   firstName: "Jean",
//   lastName: "Dupont",
//   role: "ADMIN",
//   isActive: true,
//   tokenVersion: 1,
//   profileCompleted: true,
//   organizationId: "org-1",
//   organization: { id: "org-1", name: "Acme", status: "ACTIVE", hasVoyage: true, hasCSE: false, isHost: false },
// };

// const dto = { email: "jean.dupont@acme.com", password: "Password123" };

// beforeEach(() => {
//   jest.clearAllMocks();
//   hashTokenMock.mockReturnValue("sha256-du-refresh");
// });

// describe("AuthService.login", () => {
//   it("renvoie le même message pour un email inconnu et pour un mot de passe faux", async () => {
//     findUserByEmailMock.mockResolvedValueOnce(null as never);
//     partnerLoginMock.mockRejectedValueOnce(new Error("Identifiants partenaire invalides") as never);
//     const erreurEmailInconnu = await service.login({ ...dto, email: "inconnu@acme.com" } as never).catch((e: Error) => e);

//     findUserByEmailMock.mockResolvedValueOnce(utilisateurEnBase as never);
//     comparePasswordMock.mockResolvedValueOnce(false as never);
//     const erreurMauvaisMdp = await service.login(dto as never).catch((e: Error) => e);


//     expect((erreurMauvaisMdp as Error).message).toBe((erreurEmailInconnu as Error).message);
//     expect((erreurEmailInconnu as Error).message).toBe("Email ou mot de passe incorrect");
//   });

//   it("ne persiste que le hash du refresh token dans la session, jamais le token brut", async () => {
//     findUserByEmailMock.mockResolvedValueOnce(utilisateurEnBase as never);
//     comparePasswordMock.mockResolvedValueOnce(true as never);

//     await service.login(dto as never, { userAgent: "Chrome", ipAddress: "1.2.3.4" });

//     expect(hashTokenMock).toHaveBeenCalledWith("refresh-token-1");
//     const [argsSession] = createSessionMock.mock.calls[0];
//     expect(argsSession.refreshTokenHash).toBe("sha256-du-refresh");
//     expect(JSON.stringify(argsSession)).not.toContain("refresh-token-1");
//     expect(argsSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
//   });

//   it("n'ouvre aucune session quand l'organisation est en attente de validation", async () => {
//     findUserByEmailMock.mockResolvedValueOnce({
//       ...utilisateurEnBase,
//       organization: { ...utilisateurEnBase.organization, status: "PENDING" },
//     } as never);
//     comparePasswordMock.mockResolvedValueOnce(true as never); // mot de passe correct

//     await expect(service.login(dto as never)).rejects.toThrow("Votre organisation est en attente de validation.");

//     expect(signAccessToken).not.toHaveBeenCalled();
//     expect(createSessionMock).not.toHaveBeenCalled();
//     expect(updateLastLoginMock).not.toHaveBeenCalled();
//   });

//   it("ne fait pas fuiter le hash du mot de passe dans la charge utile retournée", async () => {
//     findUserByEmailMock.mockResolvedValueOnce(utilisateurEnBase as never);
//     comparePasswordMock.mockResolvedValueOnce(true as never);

//     const resultat = await service.login(dto as never);

//     expect(resultat.user).not.toHaveProperty("password");
//     expect(JSON.stringify(resultat.user)).not.toContain(utilisateurEnBase.password);
//   });
// });





import { jest, describe, it, expect, beforeEach } from "@jest/globals";

// ============================================================================
// 1. Types locaux : on décrit uniquement ce que le service consomme réellement.
//    C'est ce qui permet de typer les mocks et donc de supprimer les `as never`.
// ============================================================================

type StatutOrganisation = "ACTIVE" | "PENDING" | "SUSPENDED";

type Organisation = {
  id: string;
  name: string;
  status: StatutOrganisation;
  hasVoyage: boolean;
  hasCSE: boolean;
  isHost: boolean;
};

type UtilisateurAvecOrganisation = {
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

// ============================================================================
// 2. Les mocks, créés une seule fois et typés avec jest.fn<Signature>().
//    jest.hoisted() garantit qu'ils existent AVANT que les jest.mock()
//    ci-dessous ne soient exécutés (les jest.mock sont remontés en haut du
//    fichier par le transformeur).
// ============================================================================

const mocks = jest.hoisted(() => ({
  // AuthRepository
  findUserByEmail: jest.fn<(email: string) => Promise<UtilisateurAvecOrganisation | null>>(),
  createSession: jest.fn<(donnees: DonneesSession) => Promise<{ id: string }>>(),
  updateLastLogin: jest.fn<(userId: string) => Promise<void>>(),
  // PartnerPortalService
  partnerLogin: jest.fn<(dto: LoginDto, contexte?: ContexteConnexion) => Promise<unknown>>(),
  // core/utils/hash
  comparePassword: jest.fn<(motDePasseClair: string, hash: string) => Promise<boolean>>(),
  hashToken: jest.fn<(token: string) => string>(),
  // core/utils/jwt
  signAccessToken: jest.fn<(payload: unknown) => string>(),
  signRefreshToken: jest.fn<(payload: unknown) => string>(),
  verifyRefreshToken: jest.fn<(token: string) => unknown>(),
}));

// ============================================================================
// 3. Remplacement des modules réels par nos doublures.
// ============================================================================

jest.mock("../../../modules/auth/infrastructure/auth.repository", () => ({
  AuthRepository: jest.fn(() => ({
    findUserByEmail: mocks.findUserByEmail,
    createSession: mocks.createSession,
    updateLastLogin: mocks.updateLastLogin,
  })),
}));

jest.mock("../../../modules/partner-portal/application/partner-portal.service", () => ({
  PartnerPortalService: jest.fn(() => ({
    login: mocks.partnerLogin,
  })),
}));

jest.mock("../../../core/utils/hash", () => ({
  comparePassword: mocks.comparePassword,
  hashToken: mocks.hashToken,
  hashPassword: jest.fn(),
}));

jest.mock("../../../core/utils/jwt", () => ({
  signAccessToken: mocks.signAccessToken,
  signRefreshToken: mocks.signRefreshToken,
  verifyRefreshToken: mocks.verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS: 30 * 24 * 60 * 60 * 1000,
}));

jest.mock("../../../core/services/email.service");

jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { AuthService } from "../../../modules/auth/application/auth.service";

// ============================================================================
// 4. Jeu de données et utilitaires de test
// ============================================================================

const service = new AuthService();

const utilisateurEnBase: UtilisateurAvecOrganisation = {
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

/** Exécute une action censée échouer et renvoie l'erreur levée. */
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

// ============================================================================
// 5. Tests
// ============================================================================

describe("AuthService.login", () => {
  it("authentifie l'utilisateur, ouvre une session et renvoie les jetons", async () => {
    mocks.findUserByEmail.mockResolvedValue(utilisateurEnBase);
    mocks.comparePassword.mockResolvedValue(true);

    const resultat = await service.login(dto, { userAgent: "Chrome", ipAddress: "1.2.3.4" });

    // L'utilisateur est bien cherché en base, puis le mot de passe vérifié
    // contre le hash stocké (et non contre le mot de passe en clair).
    expect(mocks.findUserByEmail).toHaveBeenCalledWith(dto.email);
    expect(mocks.comparePassword).toHaveBeenCalledWith(dto.password, utilisateurEnBase.password);

    // Le repli « portail partenaire » ne doit pas être tenté pour un compte interne.
    expect(mocks.partnerLogin).not.toHaveBeenCalled();

    // Une seule paire de jetons est émise, et une seule session est créée.
    expect(mocks.signAccessToken).toHaveBeenCalledTimes(1);
    expect(mocks.signRefreshToken).toHaveBeenCalledTimes(1);
    expect(mocks.createSession).toHaveBeenCalledTimes(1);

    // Le contexte de connexion est propagé jusqu'à la session.
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: utilisateurEnBase.id,
        refreshTokenHash: "sha256-du-refresh",
        userAgent: "Chrome",
        ipAddress: "1.2.3.4",
      }),
    );

    // La dernière connexion est horodatée.
    expect(mocks.updateLastLogin).toHaveBeenCalledWith(utilisateurEnBase.id);

    // Charge utile renvoyée à l'appelant.
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