import { Router } from "express";
import { EmployeeController } from "./employee.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new EmployeeController();

router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "RH"));

router.get("/",       ctrl.getAll.bind(ctrl));
router.get("/stats",  ctrl.getStats.bind(ctrl));
router.get("/:id",    ctrl.getById.bind(ctrl));

export default router;