import { Router } from "express";
import { FamilyMemberController } from "./family-member.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new FamilyMemberController();

router.use(authenticate);

router.get("/",          ctrl.list.bind(ctrl));
router.post("/",         ctrl.create.bind(ctrl));
router.get("/:id",       ctrl.getById.bind(ctrl));
router.patch("/:id",     ctrl.update.bind(ctrl));
router.delete("/:id",    ctrl.delete.bind(ctrl));

export default router;
