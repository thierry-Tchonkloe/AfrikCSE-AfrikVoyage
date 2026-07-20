import { Router } from "express";
import { TravelController } from "./travel.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new TravelController();

router.use(authenticate);

// Voyages
router.get("/",            authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), ctrl.getAll.bind(ctrl));
router.get("/stats",       authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), ctrl.getStats.bind(ctrl));
router.get("/approvals/stats", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.getApprovalStats.bind(ctrl));
router.post("/bulk-approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.bulkApprove.bind(ctrl));
router.patch("/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.approve.bind(ctrl));
router.patch("/:id/reject",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.reject.bind(ctrl));
router.patch("/:id/status",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.updateStatus.bind(ctrl));
router.patch("/:id/partner", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.assignPartner.bind(ctrl));
router.patch("/:id/payment", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), validateParams(idParamString), ctrl.updatePayment.bind(ctrl));

// Notes de frais
router.get("/expenses",             authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), ctrl.getExpenses.bind(ctrl));
router.get("/expenses/stats",       authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), ctrl.getExpenseStats.bind(ctrl));
router.patch("/expenses/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.approveExpense.bind(ctrl));
router.patch("/expenses/:id/reject",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.rejectExpense.bind(ctrl));

// Détail (placé après les routes spécifiques pour ne pas les capturer)
router.get("/:id", authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), validateParams(idParamString), ctrl.getById.bind(ctrl));

export default router;