import { Router } from "express";
import { SettingsController } from "./settings.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new SettingsController();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", ctrl.get.bind(ctrl));
router.patch("/", ctrl.update.bind(ctrl));
router.get("/dashboard", ctrl.getDashboard.bind(ctrl));

export default router;