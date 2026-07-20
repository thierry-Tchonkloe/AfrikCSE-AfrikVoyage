import { Router } from "express";
import { CashbackController } from "./cashback.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
const ctrl   = new CashbackController();

router.use(authenticate);

// ── Admin CSE / SA ────────────────────────────────────────
// NB: `id` n'est pas le 1er segment de ces routes ("/rules/:id", "/fraud-signals/:id/review") ;
// un `router.use("/:id", ...)` global ne validerait que le segment "rules"/"fraud-signals" et
// laisserait passer le vrai id sans contrôle. validateParams est donc appliqué route par route.
// ── Employé — mes cashbacks ───────────────────────────────
router.get("/my", ctrl.listMyTransactions.bind(ctrl));

// ── Admin CSE / SA ────────────────────────────────────────
router.get("/rules",                    authorize("ADMIN", "FINANCE", "MANAGER", "SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.listRules.bind(ctrl));
router.post("/rules",                   authorize("ADMIN", "SUPER_ADMIN"), ctrl.createRule.bind(ctrl));
router.patch("/rules/:id",              authorize("ADMIN", "SUPER_ADMIN"), validateParams(idParamString), ctrl.updateRule.bind(ctrl));
router.delete("/rules/:id",             authorize("ADMIN", "SUPER_ADMIN"), validateParams(idParamString), ctrl.deleteRule.bind(ctrl));
router.get("/transactions",             authorize("ADMIN", "FINANCE", "SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.listTransactions.bind(ctrl));

// ── SA / Platform Manager ─────────────────────────────────
router.get("/fraud-signals",            authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.listFraudSignals.bind(ctrl));
router.patch("/fraud-signals/:id/review", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.reviewFraudSignal.bind(ctrl));

export default router;
