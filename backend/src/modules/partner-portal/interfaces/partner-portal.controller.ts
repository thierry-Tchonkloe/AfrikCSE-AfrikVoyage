import { Request, Response, NextFunction } from "express";
import { PartnerPortalService } from "../application/partner-portal.service";
import {
    loginSchema, createStaffSchema, updateProfileSchema,
    locationSchema, setAvailabilitiesSchema, createOfferSchema, updateOfferSchema,
    updateCurrencySchema, updateApiIntegrationSchema,
    paymentMethodSchema, updatePaymentMethodSchema, toggleOfferActiveSchema,
    LocationIdParam,
} from "./partner-portal.validator";
import { IdParamString } from "../../../core/validators/param.validators";
import { setPartnerAuthCookies, clearPartnerAuthCookies } from "../../../core/utils/auth-cookies";

const service = new PartnerPortalService();

export class PartnerPortalController {
    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = loginSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const result = await service.login(parsed.data.email, parsed.data.password);
            setPartnerAuthCookies(res, result.accessToken, result.refreshToken);
            res.json({ user: result.user });
        } catch (err) { next(err); }
    }

    async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
        const refreshToken = req.cookies?.partnerRefreshToken;
        if (!refreshToken) { res.status(400).json({ message: "Refresh token requis" }); return; }
        try {
            const result = await service.refresh(refreshToken);
            setPartnerAuthCookies(res, result.accessToken, result.refreshToken);
            res.json({ ok: true });
        } catch (err) {
            clearPartnerAuthCookies(res); // refresh invalide → on nettoie tout
            next(err);
        }
    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await service.logout(req.partnerUser!.partnerUserId);
            clearPartnerAuthCookies(res);
            res.json({ message: "Déconnecté avec succès" });
        } catch (err) { next(err); }
    }

    async me(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const user = await service.me(req.partnerUser!.partnerUserId);
            res.json({ user });
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

    async deactivateStaff(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            res.json(await service.deactivateStaff(req.params.id, partnerId));
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

    async updateLocation(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = locationSchema.partial().safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updateLocation(req.params.id, partnerId, parsed.data));
        } catch (err) { next(err); }
    }

    async deleteLocation(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            await service.deleteLocation(req.params.id, partnerId);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    async setAvailabilities(req: Request<LocationIdParam>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = setAvailabilitiesSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const slots = parsed.data.slots.map((s) => ({
                ...s,
                exceptionDate: s.exceptionDate ? new Date(s.exceptionDate) : undefined,
            }));
            res.json(await service.setAvailabilities(req.params.locationId, partnerId, slots));
        } catch (err) { next(err); }
    }

    async listOffers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.listOffers(req.partnerUser!.partnerId));
        } catch (err) { next(err); }
    }

    async listOfferCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.listOfferCategories());
        } catch (err) { next(err); }
    }

    async createOffer(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const hostOrgId = await service.getHostOrgId();
            const parsed = await createOfferSchema(hostOrgId).safeParseAsync(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const data = {
                ...parsed.data,
                validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
            };
            res.status(201).json(await service.createOffer(partnerId, hostOrgId, data));
        } catch (err) { next(err); }
    }

    async updateOffer(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const hostOrgId = await service.getHostOrgId();
            const parsed = await updateOfferSchema(hostOrgId).safeParseAsync(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const data = {
                ...parsed.data,
                validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
            };
            res.json(await service.updateOffer(req.params.id, partnerId, data));
        } catch (err) { next(err); }
    }

    async toggleOfferActive(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = toggleOfferActiveSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.setOfferActive(req.params.id, partnerId, parsed.data.isActive));
        } catch (err) { next(err); }
    }

    async uploadOfferImage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            if (!req.file) { res.status(400).json({ message: "Aucun fichier fourni" }); return; }
            res.json(await service.uploadOfferImage(partnerId, req.file.buffer));
        } catch (err) { next(err); }
    }

    async uploadPartnerLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            if (!req.file) { res.status(400).json({ message: "Aucun fichier fourni" }); return; }
            res.json(await service.uploadPartnerLogo(partnerId, req.file.buffer));
        } catch (err) { next(err); }
    }

    // ── Paramètres ────────────────────────────────────────────────────────────

    async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.getSettings(req.partnerUser!.partnerId));
        } catch (err) { next(err); }
    }

    async updateCurrency(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = updateCurrencySchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updateCurrency(req.partnerUser!.partnerId, parsed.data.currencyCode));
        } catch (err) { next(err); }
    }

    async updateApiIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parsed = updateApiIntegrationSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updateApiIntegration(req.partnerUser!.partnerId, parsed.data));
        } catch (err) { next(err); }
    }

    async listPaymentMethods(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            res.json(await service.listPaymentMethods(req.partnerUser!.partnerId));
        } catch (err) { next(err); }
    }

    async createPaymentMethod(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId, partnerUserId } = req.partnerUser!;
            const parsed = paymentMethodSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.status(201).json(await service.createPaymentMethod(partnerId, partnerUserId, parsed.data));
        } catch (err) { next(err); }
    }

    async updatePaymentMethod(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = updatePaymentMethodSchema.safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            res.json(await service.updatePaymentMethod(req.params.id, partnerId, parsed.data));
        } catch (err) { next(err); }
    }

    async deletePaymentMethod(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            await service.deletePaymentMethod(req.params.id, partnerId);
            res.status(204).send();
        } catch (err) { next(err); }
    }

    // ── Espace financier ──────────────────────────────────────────────────────

    async getFinances(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const page  = parseInt(req.query.page  as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            res.json(await service.getFinances(req.partnerUser!.partnerId, page, limit));
        } catch (err) { next(err); }
    }

    async requestPayout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId, partnerUserId } = req.partnerUser!;
            res.status(201).json(await service.requestPayout(partnerId, partnerUserId));
        } catch (err) { next(err); }
    }
}
