import { Router } from "express";
import { EventController } from "./event.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new EventController();

router.use(authenticate);

router.get("/",              ctrl.getAll.bind(ctrl));
router.get("/upcoming",      ctrl.getUpcoming.bind(ctrl));
router.get("/recent",        ctrl.getRecent.bind(ctrl));
router.get("/stats",         ctrl.getStats.bind(ctrl));
router.post("/",             authorize("ADMIN", "MANAGER", "RH", "SUPER_ADMIN"), ctrl.create.bind(ctrl));
router.post("/:id/register", ctrl.register.bind(ctrl));
router.delete("/:id/register", ctrl.unregister.bind(ctrl));

export default router;