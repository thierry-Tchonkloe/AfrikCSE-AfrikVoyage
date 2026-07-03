import { Router } from "express";
import { PartnerController } from "./partner.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
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
