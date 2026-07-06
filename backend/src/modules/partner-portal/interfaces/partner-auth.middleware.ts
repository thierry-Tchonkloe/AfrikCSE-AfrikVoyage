import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface PartnerTokenPayload {
    partnerUserId: string;
    partnerId:     string;
    role:          string;
}

declare global {
    namespace Express {
        interface Request {
            partnerUser?: PartnerTokenPayload;
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET ?? "change-me";

export function authenticatePartner(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.partnerAccessToken ?? req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
        res.status(401).json({ message: "Token partenaire manquant" });
        return;
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET) as PartnerTokenPayload;
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
