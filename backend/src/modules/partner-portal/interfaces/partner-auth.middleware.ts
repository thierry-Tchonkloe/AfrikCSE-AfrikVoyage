import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../../core/config/prisma";
import { PartnerTokenPayload } from "../application/partner-portal.service";

declare global {
    namespace Express {
        interface Request {
            partnerUser?: PartnerTokenPayload;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me";

export async function authenticatePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.partnerAccessToken ?? req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ message: "Token partenaire manquant" });
        return;
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as PartnerTokenPayload;

        // Révocation immédiate (même mécanisme que auth.middleware.ts) : un logout
        // incrémente PartnerUser.tokenVersion, invalidant tous les tokens émis avant.
        const current = await prisma.partnerUser.findUnique({
            where: { id: payload.partnerUserId },
            select: { tokenVersion: true, isActive: true },
        });
        if (!current || !current.isActive || current.tokenVersion !== payload.tokenVersion) {
            res.status(401).json({ message: "Session partenaire expirée, veuillez vous reconnecter" });
            return;
        }

        req.partnerUser = payload;
        next();
    } catch {
        res.status(401).json({ message: "Token partenaire invalide ou expiré" });
    }
}

export function requirePartnerAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.partnerUser?.role !== "PARTNER_ADMIN") {
        res.status(403).json({ message: "Accès réservé aux administrateurs partenaires" });
        return;
    }
    next();
}
