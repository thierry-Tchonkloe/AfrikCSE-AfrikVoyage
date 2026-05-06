import { Router } from "express";
import { MessagingController } from "./messaging.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new MessagingController();

router.use(authenticate);

router.get("/conversations",                    ctrl.getConversations.bind(ctrl));
router.post("/conversations",                   ctrl.createConversation.bind(ctrl));
router.get("/conversations/:id/messages",       ctrl.getMessages.bind(ctrl));
router.post("/conversations/:id/messages",      ctrl.sendMessage.bind(ctrl));
router.patch("/conversations/:id/read",         ctrl.markAsRead.bind(ctrl));

export default router;