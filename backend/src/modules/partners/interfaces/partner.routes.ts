import { Router } from "express";
import { PartnerController } from "./partner.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new PartnerController();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

router.get("/",             ctrl.list.bind(ctrl));
router.post("/",            ctrl.create.bind(ctrl));
router.get("/:id",          ctrl.getById.bind(ctrl));
router.patch("/:id",        ctrl.update.bind(ctrl));
router.delete("/:id",       ctrl.delete.bind(ctrl));
router.post("/:id/sync",    ctrl.sync.bind(ctrl));
router.get("/:id/logs",     ctrl.getSyncLogs.bind(ctrl));

export default router;
