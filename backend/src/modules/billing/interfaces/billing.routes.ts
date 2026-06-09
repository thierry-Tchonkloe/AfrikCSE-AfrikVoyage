import { Router } from "express";
import { BillingController } from "./billing.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new BillingController();

// ── Routes publiques (webhooks passerelles) ───────────────────────────────────
// IMPORTANT : ces routes doivent être AVANT le middleware authenticate
// Les passerelles (KkiaPay, FedaPay) appellent ces URLs sans cookie d'auth
router.post("/webhook/kkiapay",  ctrl.kkiapayWebhook.bind(ctrl));
router.post("/webhook/fedapay",  ctrl.fedapayWebhook.bind(ctrl));

// ── Routes publiques (infos plans) ───────────────────────────────────────────
router.get("/plans",             ctrl.getPlans.bind(ctrl));

// ── Routes authentifiées ──────────────────────────────────────────────────────
router.use(authenticate, authorize("SUPER_ADMIN", "ADMIN", "FINANCE"));

router.get("/",              ctrl.getSubscription.bind(ctrl));
router.post("/upgrade",      ctrl.upgradePlan.bind(ctrl));
router.get("/invoices",      ctrl.getInvoices.bind(ctrl));

// Initiation de paiement
router.post("/pay/kkiapay",  ctrl.payWithKkiapay.bind(ctrl));
router.post("/pay/fedapay",  ctrl.payWithFedapay.bind(ctrl));
router.post("/pay/card",     ctrl.payWithCard.bind(ctrl));

export default router;
