import { Router } from "express";
import { EventPhotoController } from "./event-photo.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new EventPhotoController();

router.use(authenticate);

// Lecture par événement (tous les employés)
router.get("/event/:eventId",          ctrl.listByEvent.bind(ctrl));
// Upload par tout employé authentifié
router.post("/",                       ctrl.upload.bind(ctrl));
// Like toggle
router.post("/:id/like",               ctrl.like.bind(ctrl));
// Modération (admin+)
router.patch("/:id/moderate",          authorize("ADMIN", "MANAGER", "SUPER_ADMIN"), ctrl.moderate.bind(ctrl));
// Compteur en attente (admin+)
router.get("/pending/count",           authorize("ADMIN", "MANAGER", "SUPER_ADMIN"), ctrl.pendingCount.bind(ctrl));
// Suppression (auteur ou admin)
router.delete("/:id",                  ctrl.delete.bind(ctrl));

export default router;
