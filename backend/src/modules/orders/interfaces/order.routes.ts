import { Router } from "express";
import { OrderController } from "./order.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
const ctrl   = new OrderController();

// ── Webhooks paiement (pas d'auth JWT — sécurisés par signature/token) ────────
router.post("/webhook/kkiapay",  ctrl.webhookKkiapay.bind(ctrl));
router.post("/webhook/fedapay",  ctrl.webhookFedapay.bind(ctrl));

// ── Routes authentifiées ──────────────────────────────────────────────────────
router.use(authenticate);
router.use("/:id", validateParams(idParamString));

router.get("/admin/all", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.getAllForAdmin.bind(ctrl));

router.post("/",       ctrl.create.bind(ctrl));
router.get("/",        ctrl.getMyOrders.bind(ctrl));
router.get("/:id",     ctrl.getById.bind(ctrl));
router.delete("/:id",  ctrl.cancel.bind(ctrl));

export default router;
