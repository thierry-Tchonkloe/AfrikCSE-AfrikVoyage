import { Router } from "express";
import { FamilyMemberController } from "./family-member.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl   = new FamilyMemberController();

router.use(authenticate);

router.get("/",          ctrl.list.bind(ctrl));
router.post("/",         idempotency(), ctrl.create.bind(ctrl));
router.get("/:id",       ctrl.getById.bind(ctrl));
router.patch("/:id",     ctrl.update.bind(ctrl));
router.delete("/:id",    ctrl.delete.bind(ctrl));

export default router;
