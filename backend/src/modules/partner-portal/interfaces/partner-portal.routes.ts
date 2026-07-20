import { Router } from "express";
import rateLimit from "express-rate-limit";
import { PartnerPortalController } from "./partner-portal.controller";
import { authenticatePartner, requirePartnerAdmin } from "./partner-auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { locationIdParamSchema } from "./partner-portal.validator";

const router = Router();
const ctrl   = new PartnerPortalController();

// ── Limiteur anti-bruteforce (même politique que /api/auth/login) ──────────
const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/login",   strictAuthLimiter, ctrl.login.bind(ctrl));
router.post("/refresh", ctrl.refresh.bind(ctrl));

// ── Authenticated ─────────────────────────────────────────────────────────────
router.use(authenticatePartner);

router.post("/logout", ctrl.logout.bind(ctrl));
router.get("/me",      ctrl.me.bind(ctrl));

// Profile
router.get("/profile",  ctrl.getProfile.bind(ctrl));
router.patch("/profile", ctrl.updateProfile.bind(ctrl));

// Locations
router.post("/locations",                  ctrl.createLocation.bind(ctrl));
router.patch("/locations/:id",             validateParams(idParamString), ctrl.updateLocation.bind(ctrl));
router.delete("/locations/:id",            validateParams(idParamString), ctrl.deleteLocation.bind(ctrl));
router.put("/locations/:locationId/availabilities", validateParams(locationIdParamSchema), ctrl.setAvailabilities.bind(ctrl));

// Offers
router.get("/offers",    ctrl.listOffers.bind(ctrl));
router.post("/offers",   ctrl.createOffer.bind(ctrl));
router.patch("/offers/:id", validateParams(idParamString), ctrl.updateOffer.bind(ctrl));

// Staff — PARTNER_ADMIN only
router.get("/staff",         requirePartnerAdmin, ctrl.listStaff.bind(ctrl));
router.post("/staff",        requirePartnerAdmin, ctrl.createStaff.bind(ctrl));
router.patch("/staff/:id/deactivate", requirePartnerAdmin, validateParams(idParamString), ctrl.deactivateStaff.bind(ctrl));

export default router;
