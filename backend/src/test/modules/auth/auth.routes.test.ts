import { jest, describe, it, expect, beforeEach } from "@jest/globals";

jest.mock("../../../modules/auth/infrastructure/auth.repository");
jest.mock("../../../modules/partner-portal/application/partner-portal.service");
jest.mock("../../../core/utils/hash");
jest.mock("../../../core/services/email.service");
jest.mock("../../../core/utils/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock("../../../core/utils/jwt", () => ({
  signAccessToken: jest.fn(() => "access-token-1"),
  signRefreshToken: jest.fn(() => "refresh-token-1"),
  verifyRefreshToken: jest.fn(),
  REFRESH_TOKEN_TTL_MS: 30 * 24 * 60 * 60 * 1000,
}));

import { AuthService } from "../../../modules/auth/application/auth.service";
import { AuthRepository } from "../../../modules/auth/infrastructure/auth.repository";
import { PartnerPortalService } from "../../../modules/partner-portal/application/partner-portal.service";
import { comparePassword, hashToken } from "../../../core/utils/hash";
import { signAccessToken } from "../../../core/utils/jwt";


const findUserByEmailMock = AuthRepository.prototype.findUserByEmail as jest.Mock;
const createSessionMock = AuthRepository.prototype.createSession as jest.Mock;
const updateLastLoginMock = AuthRepository.prototype.updateLastLogin as jest.Mock;
const partnerLoginMock = PartnerPortalService.prototype.login as jest.Mock;
const comparePasswordMock = comparePassword as jest.Mock;
const hashTokenMock = hashToken as jest.Mock;

const service = new AuthService();



const utilisateurEnBase = {
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
  organization: { id: "org-1", name: "Acme", status: "ACTIVE", hasVoyage: true, hasCSE: false, isHost: false },
};

const dto = { email: "jean.dupont@acme.com", password: "Password123" };

beforeEach(() => {
  jest.clearAllMocks();
  hashTokenMock.mockReturnValue("sha256-du-refresh");
});

describe("AuthService.login", () => {
  it("renvoie le même message pour un email inconnu et pour un mot de passe faux", async () => {
    findUserByEmailMock.mockResolvedValueOnce(null as never);
    partnerLoginMock.mockRejectedValueOnce(new Error("Identifiants partenaire invalides") as never);
    const erreurEmailInconnu = await service.login({ ...dto, email: "inconnu@acme.com" } as never).catch((e: Error) => e);

    findUserByEmailMock.mockResolvedValueOnce(utilisateurEnBase as never);
    comparePasswordMock.mockResolvedValueOnce(false as never);
    const erreurMauvaisMdp = await service.login(dto as never).catch((e: Error) => e);


    expect((erreurMauvaisMdp as Error).message).toBe((erreurEmailInconnu as Error).message);
    expect((erreurEmailInconnu as Error).message).toBe("Email ou mot de passe incorrect");
  });

  it("ne persiste que le hash du refresh token dans la session, jamais le token brut", async () => {
    findUserByEmailMock.mockResolvedValueOnce(utilisateurEnBase as never);
    comparePasswordMock.mockResolvedValueOnce(true as never);

    await service.login(dto as never, { userAgent: "Chrome", ipAddress: "1.2.3.4" });

    expect(hashTokenMock).toHaveBeenCalledWith("refresh-token-1");
    const [argsSession] = createSessionMock.mock.calls[0];
    expect(argsSession.refreshTokenHash).toBe("sha256-du-refresh");
    expect(JSON.stringify(argsSession)).not.toContain("refresh-token-1");
    expect(argsSession.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("n'ouvre aucune session quand l'organisation est en attente de validation", async () => {
    findUserByEmailMock.mockResolvedValueOnce({
      ...utilisateurEnBase,
      organization: { ...utilisateurEnBase.organization, status: "PENDING" },
    } as never);
    comparePasswordMock.mockResolvedValueOnce(true as never); // mot de passe correct

    await expect(service.login(dto as never)).rejects.toThrow("Votre organisation est en attente de validation.");

    expect(signAccessToken).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(updateLastLoginMock).not.toHaveBeenCalled();
  });

  it("ne fait pas fuiter le hash du mot de passe dans la charge utile retournée", async () => {
    findUserByEmailMock.mockResolvedValueOnce(utilisateurEnBase as never);
    comparePasswordMock.mockResolvedValueOnce(true as never);

    const resultat = await service.login(dto as never);

    expect(resultat.user).not.toHaveProperty("password");
    expect(JSON.stringify(resultat.user)).not.toContain(utilisateurEnBase.password);
  });
});
