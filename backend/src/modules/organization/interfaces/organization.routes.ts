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

export default router;