import { Router } from "express";
import { CommissionController } from "./commission.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { ROLES } from "../../../shared/types";

const router = Router();
const ctrl   = new CommissionController();

router.use(authenticate);
router.use(authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER, ROLES.FINANCE, ROLES.ADMIN));

// ── Rules ─────────────────────────────────────────────────────────────────────
// CommissionRule est une entité plateforme (liée à partnerId, pas à organizationId)
// et listRules() n'est pas scopée par tenant — réservée aux rôles plateforme pour
// éviter qu'un ADMIN/FINANCE d'une organisation cliente voie les taux négociés
// avec TOUS les partenaires de la plateforme.
router.get("/rules",         authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.listRules.bind(ctrl));
router.post("/rules",        authorize(ROLES.SUPER_ADMIN), idempotency(), ctrl.createRule.bind(ctrl));
router.patch("/rules/:id",   authorize(ROLES.SUPER_ADMIN), validateParams(idParamString), ctrl.updateRule.bind(ctrl));
router.delete("/rules/:id",  authorize(ROLES.SUPER_ADMIN), validateParams(idParamString), ctrl.deleteRule.bind(ctrl));

// ── Entries / Payouts ─────────────────────────────────────────────────────────
router.get("/entries",  ctrl.listEntries.bind(ctrl));
router.get("/payouts",  ctrl.listPayouts.bind(ctrl));
router.post("/payouts", authorize(ROLES.SUPER_ADMIN), ctrl.triggerPayout.bind(ctrl));
router.patch("/payouts/:id/paid", authorize(ROLES.SUPER_ADMIN), validateParams(idParamString), ctrl.markPayoutPaid.bind(ctrl));

export default router;
