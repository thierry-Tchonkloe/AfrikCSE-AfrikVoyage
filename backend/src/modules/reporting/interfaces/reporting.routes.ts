import { Router } from "express";
import { ReportingController } from "./reporting.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new ReportingController();

router.use(authenticate);

// ── SA / Platform Manager ─────────────────────────────────────────────────────
router.get("/platform/kpis",            authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.platformKpis.bind(ctrl));
router.get("/platform/bookings/status", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.bookingsByStatus.bind(ctrl));
router.get("/platform/bookings/trend",  authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.bookingsPerMonth.bind(ctrl));
router.get("/platform/orders/trend",    authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.ordersPerMonth.bind(ctrl));
router.get("/platform/partners/top",    authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.topPartners.bind(ctrl));
router.get("/platform/commissions",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.commissionSummary.bind(ctrl));

// ── Org-level ─────────────────────────────────────────────────────────────────
router.get("/org/kpis",            authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RH", "FINANCE"), ctrl.orgKpis.bind(ctrl));
router.get("/org/bookings/trend",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"),                  ctrl.orgBookingsPerMonth.bind(ctrl));

export default router;
