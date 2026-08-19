import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { ROLES } from "../../../shared/types";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new NotificationController();

// ── Employee (authenticated) ──────────────────────────────────────────────────
router.use(authenticate);
router.get("/",             ctrl.getMine.bind(ctrl));
router.get("/unread-count", ctrl.getUnreadCount.bind(ctrl));
router.patch("/read-all",   ctrl.markAllAsRead.bind(ctrl));
router.patch("/:id/read",   ctrl.markAsRead.bind(ctrl));

// ── SA: templates ─────────────────────────────────────────────────────────────
router.get("/admin/templates",          authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.listTemplates.bind(ctrl));
router.put("/admin/templates/:event",   authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.upsertTemplate.bind(ctrl));
router.delete("/admin/templates/:event",authorize(ROLES.SUPER_ADMIN),                     ctrl.deleteTemplate.bind(ctrl));

// ── SA: logs ──────────────────────────────────────────────────────────────────
router.get("/admin/logs", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.listLogs.bind(ctrl));

export default router;
