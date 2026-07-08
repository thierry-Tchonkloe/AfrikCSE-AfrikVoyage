import { Router } from "express";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import * as ctrl from "./country-config.controller";

const router = Router();

router.use(authenticate);

// Lecture publique (pour tous les utilisateurs authentifiés)
router.get("/",        ctrl.list);
router.get("/:code",   ctrl.findByCode);

// Admin SA uniquement
router.put(   "/:code",    authorize("SUPER_ADMIN"), ctrl.upsert);
router.delete("/:code",    authorize("SUPER_ADMIN"), ctrl.remove);

export default router;
