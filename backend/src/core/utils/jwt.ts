import jwt from "jsonwebtoken";

// ✅ Une seule secret pour les deux tokens (évite les mismatches)
const JWT_SECRET = process.env.JWT_SECRET!;

// tokenVersion : doit correspondre à celui stocké en base (User.tokenVersion /
// PartnerUser.tokenVersion) — incrémenté au logout, il invalide immédiatement
// tous les tokens (access ET refresh) émis avant, sans attendre leur expiration.
export interface JwtPayload { userId: string; role: string; organizationId: string | null; isHost: boolean; tokenVersion: number; }

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