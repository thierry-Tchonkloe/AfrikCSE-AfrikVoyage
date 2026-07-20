import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new EmployeeController();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RH"));

router.get("/",       ctrl.getAll.bind(ctrl));
router.get("/stats",  ctrl.getStats.bind(ctrl));
router.get("/:id",    ctrl.getById.bind(ctrl));

export default router;