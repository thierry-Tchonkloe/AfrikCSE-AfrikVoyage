// modules/contact/interfaces/contact.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import { ContactController } from "./contact.controller";
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

router.patch(
    "/:id/status",
    // authMiddleware,
    (req: Request, res: Response, next: NextFunction) => controller.updateStatus(req, res, next)
);

export default router;