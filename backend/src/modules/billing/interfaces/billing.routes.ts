import { Router } from "express";
import { BillingController } from "./billing.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { ROLES } from "../../../shared/types";

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
router.use(authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE));

router.get("/",              ctrl.getSubscription.bind(ctrl));
router.get("/invoices",      ctrl.getInvoices.bind(ctrl));
router.get("/plans/resolved", ctrl.getResolvedPlans.bind(ctrl));

// Wallet entreprise (trésorerie de remboursement des notes de frais)
router.get("/wallet",        ctrl.getWalletBalance.bind(ctrl));
router.post("/wallet/topup", idempotency(), ctrl.topUpWallet.bind(ctrl));

// Initiation de paiement
router.post("/pay/kkiapay",  ctrl.payWithKkiapay.bind(ctrl));
router.post("/pay/fedapay",  ctrl.payWithFedapay.bind(ctrl));
router.post("/pay/card",     idempotency(), ctrl.payWithCard.bind(ctrl));

export default router;
