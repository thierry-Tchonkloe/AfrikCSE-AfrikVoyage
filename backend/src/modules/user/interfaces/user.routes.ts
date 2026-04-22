import { Router } from "express";
import { UserController } from "./user.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new UserController();

// Toutes les routes requièrent authentification
router.use(authenticate);

// Lecture : tous les rôles admin+
router.get("/", authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RH"), ctrl.getAll.bind(ctrl));
router.get("/:id", authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RH"), ctrl.getById.bind(ctrl));

// Écriture : admin uniquement
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), ctrl.create.bind(ctrl));
router.patch("/:id", authorize("SUPER_ADMIN", "ADMIN"), ctrl.update.bind(ctrl));
router.patch("/:id/role", authorize("SUPER_ADMIN", "ADMIN"), ctrl.changeRole.bind(ctrl));
router.patch("/:id/deactivate", authorize("SUPER_ADMIN", "ADMIN"), ctrl.deactivate.bind(ctrl));
router.patch("/:id/activate", authorize("SUPER_ADMIN", "ADMIN"), ctrl.activate.bind(ctrl));

export default router;