import jwt from "jsonwebtoken";

// ✅ Une seule secret pour les deux tokens (évite les mismatches)
const JWT_SECRET = process.env.JWT_SECRET!;

// tokenVersion : doit correspondre à celui stocké en base (User.tokenVersion /
// PartnerUser.tokenVersion) — incrémenté au logout, il invalide immédiatement
// tous les tokens (access ET refresh) émis avant, sans attendre leur expiration.
export interface JwtPayload { userId: string; role: string; organizationId: string | null; isHost: boolean; tokenVersion: number; }

// Durée de vie du refresh token — partagée avec le calcul de UserSession.expiresAt
// (auth.service.ts) pour que le JWT et la ligne en base expirent en même temps.
export const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function signRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "90d" });
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
}