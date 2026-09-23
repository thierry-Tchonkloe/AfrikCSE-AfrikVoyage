import { Router } from "express";
import { TravelController } from "./travel.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { requireModule } from "../../../core/middlewares/requireModule.middleware";
import { ROLES } from "../../../shared/types";

const router = Router();
const ctrl = new TravelController();

router.use(authenticate);
router.use(requireModule("VOYAGE"));

// Voyages
router.get("/",            authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.FINANCE), ctrl.getAll.bind(ctrl));
router.get("/stats",       authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.FINANCE), ctrl.getStats.bind(ctrl));
router.get("/partners",    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), ctrl.listPartners.bind(ctrl));
router.get("/approvals/stats", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), ctrl.getApprovalStats.bind(ctrl));
router.post("/bulk-approve", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), ctrl.bulkApprove.bind(ctrl));
router.patch("/:id/approve", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.approve.bind(ctrl));
router.patch("/:id/reject",  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.reject.bind(ctrl));
router.patch("/:id/status",  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.updateStatus.bind(ctrl));
router.patch("/:id/partner", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.assignPartner.bind(ctrl));
router.patch("/:id/payment", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE), validateParams(idParamString), ctrl.updatePayment.bind(ctrl));
router.patch("/:id/complete", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE), validateParams(idParamString), ctrl.complete.bind(ctrl));

// Notes de frais
router.get("/expenses",             authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.FINANCE), ctrl.getExpenses.bind(ctrl));
router.get("/expenses/stats",       authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE), ctrl.getExpenseStats.bind(ctrl));
router.patch("/expenses/:id/approve", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.approveExpense.bind(ctrl));
router.patch("/expenses/:id/reject",  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.rejectExpense.bind(ctrl));

// Détail (placé après les routes spécifiques pour ne pas les capturer)
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.FINANCE), validateParams(idParamString), ctrl.getById.bind(ctrl));

export default router;