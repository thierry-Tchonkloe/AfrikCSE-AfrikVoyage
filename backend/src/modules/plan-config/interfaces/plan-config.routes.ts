import { Router } from "express";
import { PlanConfigController } from "./plan-config.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new PlanConfigController();

// Lecture publique — utilisée par la page tarifs du site vitrine (/infos/pricing)
router.get("/public", ctrl.getPublic.bind(ctrl));

router.use(authenticate);

// Lecture — accessible à tout utilisateur authentifié (ex: page facturation entreprise)
router.get("/", ctrl.getAll.bind(ctrl));
router.get("/:id", ctrl.getById.bind(ctrl));

// Écriture — réservée au SUPER_ADMIN
const requireSuper = authorize("SUPER_ADMIN");
router.post("/", requireSuper, ctrl.create.bind(ctrl));
router.patch("/:id", requireSuper, ctrl.update.bind(ctrl));
router.delete("/:id", requireSuper, ctrl.delete.bind(ctrl));

export default router;
