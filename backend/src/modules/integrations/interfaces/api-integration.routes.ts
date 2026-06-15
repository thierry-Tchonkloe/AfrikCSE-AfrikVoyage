import { Router } from "express";
import { ApiIntegrationController } from "./api-integration.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new ApiIntegrationController();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

router.get("/",                ctrl.getAll.bind(ctrl));
router.post("/",               ctrl.create.bind(ctrl));
router.get("/:id",              ctrl.getById.bind(ctrl));
router.patch("/:id",            ctrl.update.bind(ctrl));
router.delete("/:id",           ctrl.delete.bind(ctrl));
router.get("/:id/logs",         ctrl.getSyncLogs.bind(ctrl));
router.post("/:id/test",        ctrl.testConnection.bind(ctrl));
router.post("/:id/sync",        ctrl.sync.bind(ctrl));

export default router;
