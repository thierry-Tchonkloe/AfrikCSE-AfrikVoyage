import { Router } from "express";
import { TravelPolicyController } from "./travel-policy.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
const ctrl   = new TravelPolicyController();

router.use(authenticate);
router.use(authorize("ADMIN", "MANAGER", "SUPER_ADMIN"));
router.use("/:id", validateParams(idParamString));

router.get("/",      ctrl.list.bind(ctrl));
router.post("/",     ctrl.create.bind(ctrl));
router.get("/:id",   ctrl.getById.bind(ctrl));
router.patch("/:id", ctrl.update.bind(ctrl));
router.delete("/:id", ctrl.delete.bind(ctrl));

export default router;
