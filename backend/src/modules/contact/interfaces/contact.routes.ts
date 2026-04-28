// modules/contact/interfaces/contact.routes.ts

import { Router } from "express";
import { ContactController } from "./contact.controller";
// import { authMiddleware } from "../../../core/middlewares/auth.middleware";

const router = Router();
const controller = new ContactController();

// Public routes
router.post("/", (req, res, next) => controller.create(req, res, next));

// Admin-protected routes (uncomment authMiddleware when ready)
router.get(
    "/",
    // authMiddleware,
    (req, res, next) => controller.findAll(req, res, next)
);

router.patch(
    "/:id/status",
    // authMiddleware,
    (req, res, next) => controller.updateStatus(req, res, next)
);

export default router;