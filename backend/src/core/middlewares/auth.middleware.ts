import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { Role } from "@prisma/client";

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

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // ✅ Lecture depuis le cookie HTTP-only (plus depuis Authorization header)
    const token = req.cookies?.accessToken;

    if (!token) {
        res.status(401).json({ message: "Token manquant" });
        return;
    }

    try {
        const payload = verifyAccessToken(token);
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