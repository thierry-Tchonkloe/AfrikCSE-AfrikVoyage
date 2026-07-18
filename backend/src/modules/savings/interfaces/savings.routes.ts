import { Router } from "express";
import { SavingsController } from "./savings.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new SavingsController();

router.use(authenticate);
router.get("/me", ctrl.getMySavings.bind(ctrl));

export default router;
