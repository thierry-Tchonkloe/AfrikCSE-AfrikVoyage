import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { WalletService } from "../application/wallet.service";
import { allocateSchema } from "./wallet.validator";

const service = new WalletService();

export class WalletController {
    /** GET /api/wallet — employé : son propre wallet + solde */
    async getMyWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const result = await service.getMyWallet(userId, organizationId);
            res.json(result);
        } catch (err) { next(err); }
    }

    /** GET /api/wallet/entries — historique ledger de l'employé */
    async getMyEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { userId, organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const result = await service.getMyEntries(userId, organizationId, page, limit);
            res.json(result);
        } catch (err) { next(err); }
    }

    /** POST /api/wallet/allocate — admin : allouer budget à des salariés */
    async allocate(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const parsed = allocateSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const { userIds, amount, period, description, expiresAt } = parsed.data;
            const result = await service.allocate(
                organizationId,
                userIds,
                new Prisma.Decimal(amount),
                period,
                description,
                expiresAt ? new Date(expiresAt) : undefined
            );
            res.json(result);
        } catch (err) { next(err); }
    }

    /** GET /api/wallet/admin/org — admin : wallets de toute l'organisation */
    async getOrgWallets(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { organizationId } = req.user!;
            if (!organizationId) { res.status(400).json({ message: "Organisation requise" }); return; }
            const result = await service.getOrgWallets(organizationId);
            res.json(result);
        } catch (err) { next(err); }
    }
}
