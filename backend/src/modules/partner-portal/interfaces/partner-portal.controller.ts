import { Request, Response, NextFunction } from "express";
import { PartnerPortalService } from "../application/partner-portal.service";
import {
    loginSchema, createStaffSchema, updateProfileSchema,
    locationSchema, setAvailabilitiesSchema, createOfferSchema,
} from "./partner-portal.validator";

const service = new PartnerPortalService();

export class PartnerPortalController {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = loginSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const result = await service.login(parsed.data.email, parsed.data.password);
            res.json(result);
        } catch (err) { next(err); }
    }

    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            res.json(await service.getProfile(partnerId));
        } catch (err) { next(err); }
    }

    async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = updateProfileSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updateProfile(partnerId, parsed.data));
        } catch (err) { next(err); }
    }

    async listStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.listStaff(req.partnerUser!.partnerId));
        } catch (err) { next(err); }
    }

    async createStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId, partnerUserId } = req.partnerUser!;
            const parsed = createStaffSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.status(201).json(await service.createStaff(partnerId, partnerUserId, parsed.data));
        } catch (err) { next(err); }
    }

    async deactivateStaff(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            res.json(await service.deactivateStaff(req.params.id as string, partnerId));
        } catch (err) { next(err); }
    }

    async createLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = locationSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.status(201).json(await service.createLocation(partnerId, parsed.data));
        } catch (err) { next(err); }
    }

    async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = locationSchema.partial().safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updateLocation(req.params.id as string, partnerId, parsed.data));
        } catch (err) { next(err); }
    }

    async deleteLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            await service.deleteLocation(req.params.id as string, partnerId);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    async setAvailabilities(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = setAvailabilitiesSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const slots = parsed.data.slots.map((s) => ({
                ...s,
                exceptionDate: s.exceptionDate ? new Date(s.exceptionDate) : undefined,
            }));
            res.json(await service.setAvailabilities(req.params.locationId as string, partnerId, slots));
        } catch (err) { next(err); }
    }

    async listOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.listOffers(req.partnerUser!.partnerId));
        } catch (err) { next(err); }
    }

    async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = createOfferSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const data = {
                ...parsed.data,
                validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
            };
            res.status(201).json(await service.createOffer(partnerId, data));
        } catch (err) { next(err); }
    }

    async updateOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = createOfferSchema.partial().safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const data = {
                ...parsed.data,
                validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
            };
            res.json(await service.updateOffer(req.params.id as string, partnerId, data));
        } catch (err) { next(err); }
    }
}
