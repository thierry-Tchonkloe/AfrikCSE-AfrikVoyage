import { Router } from "express";
import { BookingController } from "./booking.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { authenticatePartner } from "../../partner-portal/interfaces/partner-auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
const ctrl   = new BookingController();

// ── Partner portal bookings ──────────────────────────────────────────────────
// Enregistrées AVANT les routes employé "/:id" ci-dessous : "/:id" matche
// n'importe quel segment unique (y compris littéralement "partner"), donc
// GET /partner serait sinon intercepté par GET /:id (authenticate employé)
// et ne serait jamais atteint par authenticatePartner.
router.get("/partner",                   authenticatePartner, ctrl.getPartnerBookings.bind(ctrl));
router.patch("/partner/:id/confirm",     authenticatePartner, validateParams(idParamString), ctrl.confirmBooking.bind(ctrl));
router.patch("/partner/:id/reject",      authenticatePartner, validateParams(idParamString), ctrl.rejectBooking.bind(ctrl));
router.patch("/partner/:id/complete",    authenticatePartner, validateParams(idParamString), ctrl.completeBooking.bind(ctrl));

// ── Employee bookings ─────────────────────────────────────────────────────────
router.post("/",         authenticate, ctrl.create.bind(ctrl));
router.get("/",          authenticate, ctrl.getMyBookings.bind(ctrl));
router.get("/:id",       authenticate, validateParams(idParamString), ctrl.getById.bind(ctrl));
router.delete("/:id",    authenticate, validateParams(idParamString), ctrl.cancelByUser.bind(ctrl));
router.post("/:id/rate", authenticate, validateParams(idParamString), ctrl.rate.bind(ctrl));

// ── Admin overview ────────────────────────────────────────────────────────────
router.get("/admin/all", authenticate, authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.getAllForAdmin.bind(ctrl));

export default router;
