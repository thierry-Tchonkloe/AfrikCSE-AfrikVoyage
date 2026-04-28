import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new OrganizationController();

// Toutes les routes organisations sont réservées au SUPER_ADMIN
router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", ctrl.getAll.bind(ctrl));
router.get("/:id", ctrl.getById.bind(ctrl));
router.patch("/:id/validate", ctrl.validate.bind(ctrl));
router.patch("/:id/reject", ctrl.reject.bind(ctrl));
router.patch("/:id/modules", ctrl.updateModules.bind(ctrl));
router.patch("/:id/suspend", ctrl.suspend.bind(ctrl));
router.get("/paginated", ctrl.getPaginated.bind(ctrl));
router.post("/", ctrl.createByAdmin.bind(ctrl));
router.patch("/:id/validate-invite", ctrl.validateWithInvitation.bind(ctrl));
router.delete("/:id", ctrl.softDelete.bind(ctrl));
router.get("/my/dashboard", authenticate, ctrl.getMyDashboard.bind(ctrl));

export default router;