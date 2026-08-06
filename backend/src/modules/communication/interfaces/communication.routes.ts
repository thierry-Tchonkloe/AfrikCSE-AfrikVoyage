import { Router } from "express";
import { CommunicationController } from "./communication.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/posts/:id", validateParams(idParamString));
router.use("/poll-options/:id", validateParams(idParamString));
const ctrl = new CommunicationController();

router.use(authenticate);

router.get("/posts",                    ctrl.getPosts.bind(ctrl));
router.post("/posts",                   ctrl.createPost.bind(ctrl));
router.post("/posts/:id/like",          ctrl.toggleLike.bind(ctrl));
router.post("/posts/:id/comment",       idempotency(), ctrl.addComment.bind(ctrl));
router.get("/posts/:id/comments",       ctrl.getComments.bind(ctrl));
router.post("/poll-options/:id/vote",   ctrl.vote.bind(ctrl));

export default router;