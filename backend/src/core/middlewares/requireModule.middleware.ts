import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";

type CompanyModule = "VOYAGE" | "CSE";

const MODULE_FLAG: Record<CompanyModule, "hasVoyage" | "hasCSE"> = {
    VOYAGE: "hasVoyage",
    CSE:    "hasCSE",
};

const MODULE_LABEL: Record<CompanyModule, string> = {
    VOYAGE: "AfrikVoyage",
    CSE:    "AfrikCSE",
};

/**
 * Bloque l'accès à un module (AfrikVoyage/AfrikCSE) si le Super Admin ne l'a
 * pas activé pour l'organisation de l'appelant. Avant ce middleware, seule
 * l'UI masquait les sections désactivées — l'API restait ouverte à quiconque
 * en connaissait les endpoints, contournant le modèle "module payant activé
 * par le Super Admin".
 */
export function requireModule(module: CompanyModule) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        if (!req.user) {
            res.status(401).json({ message: "Non authentifié" });
            return;
        }
        if (!req.user.organizationId) {
            res.status(403).json({ message: "Aucune organisation associée à ce compte" });
            return;
        }

        const org = await prisma.organization.findUnique({
            where: { id: req.user.organizationId },
            select: { hasVoyage: true, hasCSE: true },
        });

        if (!org || !org[MODULE_FLAG[module]]) {
            res.status(403).json({ message: `Module ${MODULE_LABEL[module]} non activé pour votre organisation` });
            return;
        }

        next();
    };
}
