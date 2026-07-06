import { Router } from "express";
import { CommissionController } from "./commission.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new CommissionController();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "PLATFORM_MANAGER", "FINANCE", "ADMIN"));

// ── Rules ─────────────────────────────────────────────────────────────────────
router.get("/rules",         ctrl.listRules.bind(ctrl));
router.post("/rules",        authorize("SUPER_ADMIN"), ctrl.createRule.bind(ctrl));
router.patch("/rules/:id",   authorize("SUPER_ADMIN"), ctrl.updateRule.bind(ctrl));
router.delete("/rules/:id",  authorize("SUPER_ADMIN"), ctrl.deleteRule.bind(ctrl));

// ── Entries / Payouts ─────────────────────────────────────────────────────────
router.get("/entries",  ctrl.listEntries.bind(ctrl));
router.get("/payouts",  ctrl.listPayouts.bind(ctrl));
router.post("/payouts", authorize("SUPER_ADMIN"), ctrl.triggerPayout.bind(ctrl));
router.patch("/payouts/:id/paid", authorize("SUPER_ADMIN"), ctrl.markPayoutPaid.bind(ctrl));

export default router;
