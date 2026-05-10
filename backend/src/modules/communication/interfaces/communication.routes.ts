import { Router } from "express";
import { CommunicationController } from "./communication.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new CommunicationController();

router.use(authenticate);

router.get("/posts",                    ctrl.getPosts.bind(ctrl));
router.post("/posts",                   ctrl.createPost.bind(ctrl));
router.post("/posts/:id/like",          ctrl.toggleLike.bind(ctrl));
router.post("/posts/:id/comment",       ctrl.addComment.bind(ctrl));
router.post("/poll-options/:id/vote",   ctrl.vote.bind(ctrl));

export default router;