import { Router } from "express";
import { BenefitController } from "./benefit.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { ROLES } from "../../../shared/types";

const router = Router();
const ctrl = new BenefitController();



router.use(authenticate);

// Catégories — admin/manager
router.get("/categories",        authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), ctrl.getCategories.bind(ctrl));
router.post("/categories",       authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), idempotency(), ctrl.createCategory.bind(ctrl));
router.patch("/categories/:id",  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validateParams(idParamString), ctrl.updateCategory.bind(ctrl));
router.delete("/categories/:id", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), validateParams(idParamString), ctrl.deleteCategory.bind(ctrl));

// Demandes
router.get("/requests",          authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RH), ctrl.getRequests.bind(ctrl));
router.get("/requests/stats",    authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), ctrl.getApprovalStats.bind(ctrl));
router.patch("/requests/:id/approve", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.approveRequest.bind(ctrl));
router.patch("/requests/:id/reject",  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), validateParams(idParamString), ctrl.rejectRequest.bind(ctrl));
router.post("/requests/bulk-approve", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER), ctrl.bulkApprove.bind(ctrl));

// Rapports
router.get("/report", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE), ctrl.getBudgetReport.bind(ctrl));
router.get("/compliance", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE), ctrl.getComplianceReport.bind(ctrl));

export default router;