import { Router } from "express";
import { FaqController } from "./faq.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new FaqController();

router.use(authenticate);

// Lecture employé
router.get("/categories", ctrl.getCategories.bind(ctrl));
router.get("/",           ctrl.list.bind(ctrl));
router.post("/:id/vote",  ctrl.vote.bind(ctrl));

// Admin
router.get("/admin",       authorize("ADMIN", "MANAGER", "SUPER_ADMIN"), ctrl.listAll.bind(ctrl));
router.post("/",           authorize("ADMIN", "MANAGER", "SUPER_ADMIN"), ctrl.create.bind(ctrl));
router.patch("/:id",       authorize("ADMIN", "MANAGER", "SUPER_ADMIN"), ctrl.update.bind(ctrl));
router.delete("/:id",      authorize("ADMIN", "MANAGER", "SUPER_ADMIN"), ctrl.delete.bind(ctrl));

export default router;
