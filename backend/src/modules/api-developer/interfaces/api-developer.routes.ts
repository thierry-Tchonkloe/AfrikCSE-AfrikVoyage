import { Router } from "express";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import * as ctrl from "./api-developer.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

// ── API Clients ───────────────────────────────────────────────────────────────
router.get(  "/clients",          ctrl.listClients);
router.post( "/clients",          ctrl.createClient);
router.patch("/clients/:id/revoke", validateParams(idParamString), ctrl.revokeClient);
router.delete("/clients/:id",     validateParams(idParamString), ctrl.deleteClient);

// ── Webhook Endpoints ─────────────────────────────────────────────────────────
router.get(   "/webhooks",             ctrl.listWebhooks);
router.post(  "/webhooks",             ctrl.createWebhook);
router.patch( "/webhooks/:id",         validateParams(idParamString), ctrl.updateWebhook);
router.delete("/webhooks/:id",         validateParams(idParamString), ctrl.deleteWebhook);

// ── Deliveries (lecture seule) ────────────────────────────────────────────────
router.get("/webhooks/:endpointId/deliveries", validateParams(ctrl.endpointIdParam), ctrl.listDeliveries);

export default router;
