import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { ROLES } from "../../../shared/types";

const router = Router();
const ctrl   = new WalletController();

router.use(authenticate);

// ── Employé ──────────────────────────────────────────────
router.get("/",             ctrl.getMyWallet.bind(ctrl));
router.get("/entries",      ctrl.getMyEntries.bind(ctrl));

// ── Admin ────────────────────────────────────────────────
router.post("/allocate",    authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.SUPER_ADMIN), ctrl.allocate.bind(ctrl));
router.get("/admin/org",    authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.MANAGER, ROLES.SUPER_ADMIN), ctrl.getOrgWallets.bind(ctrl));

export default router;
