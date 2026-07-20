import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";

declare global {
    namespace Express {
        interface Request {
        user?: {
            userId:         string;
            role:           Role;
            organizationId: string | null;
            isHost:         boolean;
        };
        }
    }
}

export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    // ✅ Lecture depuis le cookie HTTP-only (plus depuis Authorization header)
    const token = req.cookies?.accessToken;

    if (!token) {
        res.status(401).json({ message: "Token manquant" });
        return;
    }

    try {
        const payload = verifyAccessToken(token);

        // Révocation immédiate : le tokenVersion embarqué dans le JWT doit correspondre
        // à celui stocké en base. Un logout (ou un reset password) incrémente ce compteur,
        // ce qui invalide instantanément TOUS les tokens émis avant — access ET refresh —
        // sans attendre leur expiration naturelle.
        // Note : ce middleware ne reconnaît que les comptes `User` — les partenaires ont
        // leur propre système d'authentification dédié (voir partner-auth.middleware.ts).
        const current = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { tokenVersion: true, isActive: true },
        });

        if (!current || !current.isActive || current.tokenVersion !== payload.tokenVersion) {
        res.status(401).json({ message: "Session expirée, veuillez vous reconnecter" });
        return;
        }

        req.user = {
        userId:         payload.userId,
        role:           payload.role as Role,
        organizationId: payload.organizationId,
        isHost:         payload.isHost,
        };
        next();
    } catch {
        res.status(401).json({ message: "Token invalide ou expiré" });
    }
}

// ── authorize — inchangé ───────────────────────────────────────────────────────
export function authorize(...roles: Role[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
        res.status(401).json({ message: "Non authentifié" });
        return;
        }
        if (!roles.includes(req.user.role)) {
        res.status(403).json({ message: "Accès interdit" });
        return;
        }
        next();
    };
}