import { Router } from "express";
import { TravelRewardController } from "./travel-reward.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new TravelRewardController();

router.use(authenticate);

router.get("/",        ctrl.getMyRewards.bind(ctrl));
router.get("/balance", ctrl.getBalance.bind(ctrl));

export default router;
