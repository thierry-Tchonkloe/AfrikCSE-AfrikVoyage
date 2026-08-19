import { Router } from "express";
import { UserController } from "./user.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { ROLES } from "../../../shared/types";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new UserController();

// Toutes les routes requièrent authentification
router.use(authenticate);

// Lecture : tous les rôles admin+
router.get("/", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RH), ctrl.getAll.bind(ctrl));
// Doit être déclarée avant "/:id" — sinon "host" serait interprété comme un id
router.get("/host", authorize(ROLES.SUPER_ADMIN), ctrl.getHostUsers.bind(ctrl));
router.get("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RH), ctrl.getById.bind(ctrl));

// Écriture : admin uniquement
router.post("/", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.create.bind(ctrl));
router.patch("/:id", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.update.bind(ctrl));
router.patch("/:id/role", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.changeRole.bind(ctrl));
router.patch("/:id/deactivate", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.deactivate.bind(ctrl));
router.patch("/:id/activate", authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), ctrl.activate.bind(ctrl));

export default router;