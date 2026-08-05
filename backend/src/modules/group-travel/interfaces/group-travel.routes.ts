import { Router } from "express";
import { GroupTravelController } from "./group-travel.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl   = new GroupTravelController();

router.use(authenticate);

router.get("/",               ctrl.list.bind(ctrl));
router.post("/",              idempotency(), ctrl.create.bind(ctrl));
router.get("/:id",            ctrl.getById.bind(ctrl));
router.patch("/:id",          ctrl.update.bind(ctrl));
router.patch("/:id/status",   ctrl.updateStatus.bind(ctrl));
router.delete("/:id",         ctrl.delete.bind(ctrl));
router.post("/:id/invite",    ctrl.invite.bind(ctrl));
router.post("/:id/respond",   ctrl.respond.bind(ctrl));

export default router;
