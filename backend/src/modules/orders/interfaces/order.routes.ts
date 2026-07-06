import { Router } from "express";
import { OrderController } from "./order.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new OrderController();

router.use(authenticate);

router.post("/",       ctrl.create.bind(ctrl));
router.get("/",        ctrl.getMyOrders.bind(ctrl));
router.get("/:id",     ctrl.getById.bind(ctrl));
router.delete("/:id",  ctrl.cancel.bind(ctrl));

export default router;
