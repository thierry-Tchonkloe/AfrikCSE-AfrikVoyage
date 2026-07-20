// modules/contact/interfaces/contact.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import { ContactController } from "./contact.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamInt, IdParamInt } from "../../../core/validators/param.validators";
// import { authMiddleware } from "../../../core/middlewares/auth.middleware";

const router = Router();
const controller = new ContactController();

// Public routes
router.post("/", (req: Request, res: Response, next: NextFunction) => controller.create(req, res, next));

// Admin-protected routes (uncomment authMiddleware when ready)
router.get(
    "/",
    // authMiddleware,
    (req: Request, res: Response, next: NextFunction) => controller.findAll(req, res, next)
);

router.patch<IdParamInt>(
    "/:id/status",
    // authMiddleware,
    validateParams(idParamInt),
    controller.updateStatus.bind(controller)
);

export default router;