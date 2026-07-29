import { Request, Response } from "express";
import { PartnerService } from "../application/partner.service";
import {
    createPartnerSchema,
    updatePartnerSchema,
    filterPartnerSchema,
    rejectOfferSchema,
    OfferIdParam,
} from "./partner.validator";
import { IdParamString } from "../../../core/validators/param.validators";
import { logAudit } from "../../../core/utils/audit";

const service = new PartnerService();

export class PartnerController {
    async list(req: Request, res: Response): Promise<void> {
        const parsed = filterPartnerSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        const data = await service.list(parsed.data);
        res.json(data);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const data = await service.getById(req.params.id);
            res.json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createPartnerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const data = await service.create(req.user!.userId, parsed.data);
            res.status(201).json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updatePartnerSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const data = await service.update(req.params.id, parsed.data);
            res.json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id);
            res.json({ message: "Partenaire supprimé" });
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async sync(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const result = await service.sync(req.params.id);
            res.json(result);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async getSyncLogs(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const data = await service.getSyncLogs(req.params.id);
            res.json(data);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async listPendingOffers(_req: Request, res: Response): Promise<void> {
        const data = await service.listPendingOffers();
        res.json(data);
    }

    async approveOffer(req: Request<OfferIdParam>, res: Response): Promise<void> {
        try {
            const offer = await service.approveOffer(req.params.offerId, req.user!.userId);
            await logAudit({
                action:   "PARTNER_OFFER_APPROVED",
                entity:   "BenefitCatalogItem",
                entityId: offer.id,
                userId:   req.user!.userId,
                newValue: { isActive: true },
                req,
            });
            res.status(200).json({ message: "Offre validée", offer });
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async rejectOffer(req: Request<OfferIdParam>, res: Response): Promise<void> {
        const parsed = rejectOfferSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const offer = await service.rejectOffer(req.params.offerId, req.user!.userId, parsed.data.note);
            await logAudit({
                action:   "PARTNER_OFFER_REJECTED",
                entity:   "BenefitCatalogItem",
                entityId: offer.id,
                userId:   req.user!.userId,
                newValue: parsed.data,
                req,
            });
            res.status(200).json({ message: "Offre refusée", offer });
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }
}
