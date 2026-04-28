// import { Router } from "express";
// import { login, register } from "./auth.controller";

// const router = Router();

// router.post("/register", register);
// router.post("/login", login);

// export default router;




import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new AuthController();

// ── Routes publiques (sans authentification) ──────────
router.post("/register-company", ctrl.registerCompany.bind(ctrl));
router.post("/login", ctrl.login.bind(ctrl));
router.post("/refresh", ctrl.refresh.bind(ctrl));
router.post("/forgot-password", ctrl.forgotPassword.bind(ctrl));
router.post("/reset-password", ctrl.resetPassword.bind(ctrl));

// ── Routes protégées (token requis) ───────────────────
router.post("/logout", authenticate, ctrl.logout.bind(ctrl));
router.get("/me", authenticate, ctrl.me.bind(ctrl));
router.patch("/complete-profile", authenticate, ctrl.completeProfile.bind(ctrl));
router.post("/activate", ctrl.activateAccount.bind(ctrl));


export default router;