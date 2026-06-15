import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new NotificationController();

router.use(authenticate);

router.get("/",             ctrl.getMine.bind(ctrl));
router.get("/unread-count", ctrl.getUnreadCount.bind(ctrl));
router.patch("/read-all",   ctrl.markAllAsRead.bind(ctrl));
router.patch("/:id/read",   ctrl.markAsRead.bind(ctrl));

export default router;
