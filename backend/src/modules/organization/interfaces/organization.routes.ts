import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new OrganizationController();

// Toutes les routes organisations nécessitent d'être authentifié.
router.use(authenticate);
// Middleware helper pour routes réservées au SUPER_ADMIN
const requireSuper = authorize("SUPER_ADMIN");

// Routes réservées au SUPER_ADMIN
router.get("/", requireSuper, ctrl.getAll.bind(ctrl));
router.post("/", requireSuper, ctrl.createByAdmin.bind(ctrl));
router.get("/paginated", requireSuper, ctrl.getPaginated.bind(ctrl));

// Tableau de bord de l'organisation connectée (tout utilisateur authentifié)
router.get("/my/dashboard", ctrl.getMyDashboard.bind(ctrl));

// Routes CRUD/Admin — réservées au SUPER_ADMIN
router.get("/:id", requireSuper, ctrl.getById.bind(ctrl));
router.patch("/:id/validate", requireSuper, ctrl.validate.bind(ctrl));
router.patch("/:id/reject", requireSuper, ctrl.reject.bind(ctrl));
router.patch("/:id/modules", requireSuper, ctrl.updateModules.bind(ctrl));
router.patch("/:id/suspend", requireSuper, ctrl.suspend.bind(ctrl));
router.patch("/:id/validate-invite", requireSuper, ctrl.validateWithInvitation.bind(ctrl));
router.delete("/:id", requireSuper, ctrl.softDelete.bind(ctrl));

router.patch("/:id",              ctrl.update.bind(ctrl));
router.patch("/:id/reactivate",   ctrl.reactivate.bind(ctrl));
router.post("/:id/invite",        ctrl.regenerateInvitation.bind(ctrl));
export default router;