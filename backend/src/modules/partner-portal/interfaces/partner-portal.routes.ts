import { Router } from "express";
import { PartnerPortalController } from "./partner-portal.controller";
import { authenticatePartner, requirePartnerAdmin } from "./partner-auth.middleware";

const router = Router();
const ctrl   = new PartnerPortalController();

// ── Public (login) ────────────────────────────────────────────────────────────
router.post("/login", ctrl.login.bind(ctrl));

// ── Authenticated ─────────────────────────────────────────────────────────────
router.use(authenticatePartner);

// Profile
router.get("/profile",  ctrl.getProfile.bind(ctrl));
router.patch("/profile", ctrl.updateProfile.bind(ctrl));

// Locations
router.post("/locations",                  ctrl.createLocation.bind(ctrl));
router.patch("/locations/:id",             ctrl.updateLocation.bind(ctrl));
router.delete("/locations/:id",            ctrl.deleteLocation.bind(ctrl));
router.put("/locations/:locationId/availabilities", ctrl.setAvailabilities.bind(ctrl));

// Offers
router.get("/offers",    ctrl.listOffers.bind(ctrl));
router.post("/offers",   ctrl.createOffer.bind(ctrl));
router.patch("/offers/:id", ctrl.updateOffer.bind(ctrl));

// Staff — PARTNER_ADMIN only
router.get("/staff",         requirePartnerAdmin, ctrl.listStaff.bind(ctrl));
router.post("/staff",        requirePartnerAdmin, ctrl.createStaff.bind(ctrl));
router.patch("/staff/:id/deactivate", requirePartnerAdmin, ctrl.deactivateStaff.bind(ctrl));

export default router;
