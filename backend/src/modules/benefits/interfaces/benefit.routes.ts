import { Router } from "express";
import { BenefitController } from "./benefit.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new BenefitController();

router.use(authenticate);

// Catégories — admin/manager
router.get("/categories",        authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.getCategories.bind(ctrl));
router.post("/categories",       authorize("SUPER_ADMIN", "ADMIN"), ctrl.createCategory.bind(ctrl));
router.patch("/categories/:id",  authorize("SUPER_ADMIN", "ADMIN"), validateParams(idParamString), ctrl.updateCategory.bind(ctrl));
router.delete("/categories/:id", authorize("SUPER_ADMIN", "ADMIN"), validateParams(idParamString), ctrl.deleteCategory.bind(ctrl));

// Demandes
router.get("/requests",          authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RH"), ctrl.getRequests.bind(ctrl));
router.get("/requests/stats",    authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.getApprovalStats.bind(ctrl));
router.patch("/requests/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.approveRequest.bind(ctrl));
router.patch("/requests/:id/reject",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), validateParams(idParamString), ctrl.rejectRequest.bind(ctrl));
router.post("/requests/bulk-approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.bulkApprove.bind(ctrl));

// Rapports
router.get("/report", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), ctrl.getBudgetReport.bind(ctrl));
router.get("/compliance", authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), ctrl.getComplianceReport.bind(ctrl));

export default router;