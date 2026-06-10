import { Router } from "express";
import { EventController } from "./event.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new EventController();

router.use(authenticate);

router.get("/",              ctrl.getAll.bind(ctrl));
router.get("/upcoming",      ctrl.getUpcoming.bind(ctrl));
router.get("/recent",        ctrl.getRecent.bind(ctrl));
router.get("/stats",         ctrl.getStats.bind(ctrl));
router.post("/",             ctrl.create.bind(ctrl));
router.post("/:id/register", ctrl.register.bind(ctrl));
router.delete("/:id/register", ctrl.unregister.bind(ctrl));

export default router;