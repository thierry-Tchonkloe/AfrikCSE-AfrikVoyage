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

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => {
    throw new Error("JWT_SECRET manquant dans l'environnement");
})();

export async function authenticatePartner(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.partnerAccessToken ?? req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ message: "Token partenaire manquant" });
        return;
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as PartnerTokenPayload & { type?: string };
        if (payload.type !== "access") {
            res.status(401).json({ message: "Type de token invalide" });
            return;
        }

        // Révocation immédiate (même mécanisme que auth.middleware.ts) : un logout
        // incrémente PartnerUser.tokenVersion, invalidant tous les tokens émis avant.
        const current = await prisma.partnerUser.findUnique({
            where: { id: payload.partnerUserId },
            select: { tokenVersion: true, isActive: true, partner: { select: { status: true } } },
        });
        if (!current || !current.isActive || current.tokenVersion !== payload.tokenVersion) {
            res.status(401).json({ message: "Session partenaire expirée, veuillez vous reconnecter" });
            return;
        }

        // Une suspension du partenaire (par le Super Admin) doit couper NET tout
        // accès, même pour une session déjà émise avant la suspension — sans ce
        // contrôle, seul `login()` bloquait les nouvelles connexions, laissant un
        // partenaire suspendu opérer jusqu'à 90 jours via son refresh token.
        if (current.partner.status === "SUSPENDED") {
            res.status(403).json({ message: "Ce compte partenaire a été suspendu" });
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
