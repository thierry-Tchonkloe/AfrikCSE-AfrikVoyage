import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { logoUpload } from "../../../core/middlewares/upload.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new OrganizationController();

// Toutes les routes organisations nécessitent d'être authentifié.
router.use(authenticate);
// Middleware helper pour routes réservées au SUPER_ADMIN
const requireSuper = authorize("SUPER_ADMIN");

// Routes réservées au SUPER_ADMIN
router.get("/", requireSuper, ctrl.getAll.bind(ctrl));
router.post("/", requireSuper, ctrl.createByAdmin.bind(ctrl));
router.get("/paginated", requireSuper, ctrl.getPaginated.bind(ctrl));
// Doit être déclarée avant "/:id" — sinon "export" serait interprété comme un id
router.get("/export", requireSuper, ctrl.exportCsv.bind(ctrl));

// Tableau de bord de l'organisation connectée (tout utilisateur authentifié)
router.get("/my/dashboard", ctrl.getMyDashboard.bind(ctrl));

// Mise à jour de sa propre organisation — réservée ADMIN, MANAGER, RH, FINANCE
router.patch("/my", authorize("ADMIN", "MANAGER"), ctrl.updateMyOrg.bind(ctrl));

// Upload du logo de l'organisation connectée — réservée ADMIN, MANAGER
router.post("/my/logo", authorize("ADMIN", "MANAGER"), logoUpload.single("file"), ctrl.uploadLogo.bind(ctrl));

// Routes CRUD/Admin — réservées au SUPER_ADMIN
router.get("/:id", requireSuper, ctrl.getById.bind(ctrl));
router.patch("/:id/validate", requireSuper, ctrl.validate.bind(ctrl));
router.patch("/:id/reject", requireSuper, ctrl.reject.bind(ctrl));
router.patch("/:id/modules", requireSuper, ctrl.updateModules.bind(ctrl));
router.patch("/:id/suspend", requireSuper, ctrl.suspend.bind(ctrl));
router.patch("/:id/validate-invite", requireSuper, ctrl.validateWithInvitation.bind(ctrl));
router.delete("/:id", requireSuper, ctrl.softDelete.bind(ctrl));

router.patch("/:id",              requireSuper, ctrl.update.bind(ctrl));
router.patch("/:id/reactivate",   requireSuper, ctrl.reactivate.bind(ctrl));
router.post("/:id/invite",        requireSuper, ctrl.regenerateInvitation.bind(ctrl));
export default router;