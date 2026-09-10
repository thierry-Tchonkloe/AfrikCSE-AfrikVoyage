// import { Router } from "express";
// import { login, register } from "./auth.controller";

// const router = Router();

// router.post("/register", register);
// router.post("/login", login);

// export default router;




import { Router } from "express";
import rateLimit from "express-rate-limit";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new AuthController();

// ── Limiteur strict anti-bruteforce sur les endpoints sensibles ─────────
const strictAuthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.RATELIMIT_MAX ? parseInt(process.env.RATELIMIT_MAX) : 5,
    message: { message: "Trop de tentatives, réessayez dans 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

// ── Routes publiques (sans authentification) ──────────
router.post("/register-company", strictAuthLimiter, ctrl.registerCompany.bind(ctrl));
router.post("/login", strictAuthLimiter, ctrl.login.bind(ctrl));
router.post("/refresh", ctrl.refresh.bind(ctrl));
router.post("/forgot-password", strictAuthLimiter, ctrl.forgotPassword.bind(ctrl));
router.post("/reset-password", strictAuthLimiter, ctrl.resetPassword.bind(ctrl));

// ── Routes protégées (token requis) ───────────────────
router.post("/logout", authenticate, ctrl.logout.bind(ctrl));
router.get("/me", authenticate, ctrl.me.bind(ctrl));
router.patch("/complete-profile", authenticate, ctrl.completeProfile.bind(ctrl));
router.patch("/change-password", authenticate, ctrl.changePassword.bind(ctrl));
router.post("/activate", strictAuthLimiter, ctrl.activateAccount.bind(ctrl));

// ── Sessions (appareils connectés) ────────────────────
// ⚠️ "/sessions/others" doit être déclaré AVANT "/sessions/:id", sinon Express
// interpréterait "others" comme un :id.
router.get("/sessions", authenticate, ctrl.listSessions.bind(ctrl));
router.delete("/sessions/others", authenticate, ctrl.revokeOtherSessions.bind(ctrl));
router.delete("/sessions/:id", authenticate, ctrl.revokeSession.bind(ctrl));


export default router;