import { Router } from "express";
import rateLimit from "express-rate-limit";
import { PartnerPortalController } from "./partner-portal.controller";
import { authenticatePartner, requirePartnerAdmin } from "./partner-auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { locationIdParamSchema } from "./partner-portal.validator";
import { offerImageUpload } from "../../../core/middlewares/upload.middleware";

const router = Router();
const ctrl   = new PartnerPortalController();

// ── Limiteur anti-bruteforce (même politique que /api/auth/login) ──────────
const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.RATELIMIT_MAX ? parseInt(process.env.RATELIMIT_MAX) : 5,
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
router.post("/locations",                  idempotency(), ctrl.createLocation.bind(ctrl));
router.patch("/locations/:id",             validateParams(idParamString), ctrl.updateLocation.bind(ctrl));
router.delete("/locations/:id",            validateParams(idParamString), ctrl.deleteLocation.bind(ctrl));
router.put("/locations/:locationId/availabilities", validateParams(locationIdParamSchema), ctrl.setAvailabilities.bind(ctrl));

// Offers
router.get("/offers",    ctrl.listOffers.bind(ctrl));
router.post("/offers",   idempotency(), ctrl.createOffer.bind(ctrl));
router.patch("/offers/:id", validateParams(idParamString), ctrl.updateOffer.bind(ctrl));
// Upload indépendant de l'offre (nécessaire pour rendre l'image obligatoire dès la création :
// on l'upload d'abord pour obtenir l'URL, puis on la fournit à POST/PATCH /offers).
router.post("/offers/image", offerImageUpload.single("file"), ctrl.uploadOfferImage.bind(ctrl));

// Staff — PARTNER_ADMIN only
router.get("/staff",         requirePartnerAdmin, ctrl.listStaff.bind(ctrl));
router.post("/staff",        requirePartnerAdmin, ctrl.createStaff.bind(ctrl));
router.patch("/staff/:id/deactivate", requirePartnerAdmin, validateParams(idParamString), ctrl.deactivateStaff.bind(ctrl));

// Paramètres
router.get("/settings",   ctrl.getSettings.bind(ctrl));
router.patch("/settings/currency",        requirePartnerAdmin, ctrl.updateCurrency.bind(ctrl));
router.patch("/settings/api-integration", requirePartnerAdmin, ctrl.updateApiIntegration.bind(ctrl));

// Moyens de réception de paiement — PARTNER_ADMIN only
router.get("/settings/payment-methods",     requirePartnerAdmin, ctrl.listPaymentMethods.bind(ctrl));
router.post("/settings/payment-methods",    requirePartnerAdmin, idempotency(), ctrl.createPaymentMethod.bind(ctrl));
router.patch("/settings/payment-methods/:id", requirePartnerAdmin, validateParams(idParamString), ctrl.updatePaymentMethod.bind(ctrl));
router.delete("/settings/payment-methods/:id", requirePartnerAdmin, validateParams(idParamString), ctrl.deletePaymentMethod.bind(ctrl));

export default router;
