import { Router } from "express";
import { AuditLogController } from "./audit-log.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new AuditLogController();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

// Routes spécifiques avant /:id-like
router.get("/export", ctrl.exportCsv.bind(ctrl));
router.get("/actions", ctrl.getActions.bind(ctrl));
router.get("/", ctrl.getAll.bind(ctrl));

export default router;
