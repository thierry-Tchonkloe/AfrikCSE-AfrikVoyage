// Helper partagé pour simuler une session utilisateur valide dans les tests
// de routes protégées par `authenticate` (voir core/middlewares/auth.middleware.ts).
// Chaque fichier de test possède son propre registre de modules Jest, donc les
// mocks de `verifyAccessToken` et `prisma` doivent être passés explicitement
// (impossible de les partager tels quels entre fichiers de test).
import jwt from "jsonwebtoken";
import type { DeepMockProxy } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";

export interface FakeSessionPayload {
  userId: string;
  role: string;
  organizationId: string | null;
  isHost: boolean;
  tokenVersion: number;
}

/**
 * Configure `verifyAccessTokenMock` pour renvoyer un payload valide et fait
 * répondre `prismaMock.user.findUnique` (utilisé par `authenticate`) avec un
 * utilisateur actif dont le tokenVersion correspond — l'authentification passe.
 * Retourne le header Cookie à utiliser avec `.set("Cookie", ...)`.
 */
export function mockAuthenticatedSession(
  prismaMock: DeepMockProxy<PrismaClient>,
  verifyAccessTokenMock: jest.Mock,
  overrides: Partial<FakeSessionPayload> = {}
): string[] {
  const payload: FakeSessionPayload = {
    userId: "user-1",
    role: "ADMIN",
    organizationId: "org-1",
    isHost: false,
    tokenVersion: 1,
    ...overrides,
  };

  verifyAccessTokenMock.mockReturnValue(payload);
  prismaMock.user.findUnique.mockResolvedValueOnce({
    tokenVersion: payload.tokenVersion,
    isActive: true,
  } as never);

  return ["accessToken=session-valide"];
}

// ── Session partenaire (authenticatePartner) ─────────────────────────────────
// `authenticatePartner` (modules/partner-portal/interfaces/partner-auth.middleware.ts)
// vérifie le JWT avec le package `jsonwebtoken` RÉEL (pas notre wrapper
// `core/utils/jwt`, qui reste donc non mocké dans ce contexte) : on signe donc
// un vrai token ici plutôt que de simuler un payload décodé.

export interface FakePartnerSessionPayload {
  partnerUserId: string;
  partnerId: string;
  role: string;
  tokenVersion: number;
}

/**
 * Signe un vrai JWT partenaire (avec process.env.JWT_SECRET) et fait répondre
 * `prismaMock.partnerUser.findUnique` (utilisé par `authenticatePartner`) avec
 * un compte partenaire actif dont le tokenVersion correspond.
 * Retourne le header Cookie à utiliser avec `.set("Cookie", ...)`.
 */
export function mockAuthenticatedPartnerSession(
  prismaMock: DeepMockProxy<PrismaClient>,
  overrides: Partial<FakePartnerSessionPayload> = {}
): string[] {
  const payload: FakePartnerSessionPayload = {
    partnerUserId: "partner-user-1",
    partnerId: "partner-1",
    role: "PARTNER_STAFF",
    tokenVersion: 1,
    ...overrides,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET as string);
  prismaMock.partnerUser.findUnique.mockResolvedValueOnce({
    tokenVersion: payload.tokenVersion,
    isActive: true,
  } as never);

  return [`partnerAccessToken=${token}`];
}
