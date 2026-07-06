import { Router } from "express";
import { CashbackController } from "./cashback.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new CashbackController();

router.use(authenticate);

// ── Admin CSE / SA ────────────────────────────────────────
router.get("/rules",                    authorize("ADMIN", "FINANCE", "MANAGER", "SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.listRules.bind(ctrl));
router.post("/rules",                   authorize("ADMIN", "SUPER_ADMIN"), ctrl.createRule.bind(ctrl));
router.patch("/rules/:id",              authorize("ADMIN", "SUPER_ADMIN"), ctrl.updateRule.bind(ctrl));
router.delete("/rules/:id",             authorize("ADMIN", "SUPER_ADMIN"), ctrl.deleteRule.bind(ctrl));
router.get("/transactions",             authorize("ADMIN", "FINANCE", "SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.listTransactions.bind(ctrl));

// ── SA / Platform Manager ─────────────────────────────────
router.get("/fraud-signals",            authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.listFraudSignals.bind(ctrl));
router.patch("/fraud-signals/:id/review", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.reviewFraudSignal.bind(ctrl));

export default router;
