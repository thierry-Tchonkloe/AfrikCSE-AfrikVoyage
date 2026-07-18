import { Request, Response, NextFunction } from "express";
import { PartnerPortalService } from "../application/partner-portal.service";
import {
    loginSchema, createStaffSchema, updateProfileSchema,
    locationSchema, setAvailabilitiesSchema, createOfferSchema,
    LocationIdParam,
} from "./partner-portal.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new PartnerPortalService();

// ── Cookies dédiés partenaire ────────────────────────────────────────────────
// Noms distincts de ceux du système utilisateur standard (accessToken/refreshToken)
// pour qu'une session partenaire ne puisse jamais interférer avec une session User
// sur le même navigateur (ex: un même poste utilisé pour les deux portails).
const IS_PROD = process.env.NODE_ENV === "production";

const PARTNER_COOKIE_BASE = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: (IS_PROD ? "none" : "lax") as "none" | "lax",
    partitioned: IS_PROD,
    path:   "/",
} as const;

function setPartnerAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie("partnerAccessToken", accessToken, {
        ...PARTNER_COOKIE_BASE,
        maxAge: 24 * 60 * 60 * 1000, // 24h — aligné sur la durée du JWT
    });
    res.cookie("partnerRefreshToken", refreshToken, {
        ...PARTNER_COOKIE_BASE,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90j
    });
}

function clearPartnerAuthCookies(res: Response) {
    res.clearCookie("partnerAccessToken", { ...PARTNER_COOKIE_BASE });
    res.clearCookie("partnerRefreshToken", { ...PARTNER_COOKIE_BASE });
}

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

    async updateOffer(req: Request<IdParamString>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { partnerId } = req.partnerUser!;
            const parsed = createOfferSchema.partial().safeParse(req.body);
            if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
            const data = {
                ...parsed.data,
                validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : undefined,
            };
            res.json(await service.updateOffer(req.params.id, partnerId, data));
        } catch (err) { next(err); }
    }
}
