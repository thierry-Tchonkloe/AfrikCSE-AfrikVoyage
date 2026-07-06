import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new WalletController();

router.use(authenticate);

// ── Employé ──────────────────────────────────────────────
router.get("/",             ctrl.getMyWallet.bind(ctrl));
router.get("/entries",      ctrl.getMyEntries.bind(ctrl));

// ── Admin ────────────────────────────────────────────────
router.post("/allocate",    authorize("ADMIN", "FINANCE", "SUPER_ADMIN"), ctrl.allocate.bind(ctrl));
router.get("/admin/org",    authorize("ADMIN", "FINANCE", "MANAGER", "SUPER_ADMIN"), ctrl.getOrgWallets.bind(ctrl));

export default router;
