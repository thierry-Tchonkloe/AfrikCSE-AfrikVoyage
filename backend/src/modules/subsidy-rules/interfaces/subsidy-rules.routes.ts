import { Router } from "express";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { SubsidyRulesController } from "./subsidy-rules.controller";

const router = Router();
const ctrl = new SubsidyRulesController();

router.use(authenticate, authorize("ADMIN", "SUPER_ADMIN"));

router.get("/",        ctrl.getAll.bind(ctrl));
router.get("/:id",     ctrl.getById.bind(ctrl));
router.post("/",       ctrl.create.bind(ctrl));
router.put("/:id",     ctrl.update.bind(ctrl));
router.delete("/:id",  ctrl.remove.bind(ctrl));

export default router;
