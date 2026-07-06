import { Router } from "express";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import * as ctrl from "./api-developer.controller";

const router = Router();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN", "ADMIN"));

// ── API Clients ───────────────────────────────────────────────────────────────
router.get(  "/clients",          ctrl.listClients);
router.post( "/clients",          ctrl.createClient);
router.patch("/clients/:id/revoke", ctrl.revokeClient);
router.delete("/clients/:id",     ctrl.deleteClient);

// ── Webhook Endpoints ─────────────────────────────────────────────────────────
router.get(   "/webhooks",             ctrl.listWebhooks);
router.post(  "/webhooks",             ctrl.createWebhook);
router.patch( "/webhooks/:id",         ctrl.updateWebhook);
router.delete("/webhooks/:id",         ctrl.deleteWebhook);

// ── Deliveries (lecture seule) ────────────────────────────────────────────────
router.get("/webhooks/:endpointId/deliveries", ctrl.listDeliveries);

export default router;
