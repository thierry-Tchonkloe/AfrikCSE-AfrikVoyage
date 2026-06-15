import { Router } from "express";
import { EmployeeSpaceController } from "./employee-space.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";
import { receiptUpload, logoUpload } from "../../../core/middlewares/upload.middleware";

const router = Router();
const ctrl = new EmployeeSpaceController();

router.use(authenticate);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard",   ctrl.getDashboard.bind(ctrl));

// ── Voyages ───────────────────────────────────────────────────────────────────
router.get("/travels",     ctrl.getMyTravels.bind(ctrl));
router.post("/travels",    ctrl.createTravel.bind(ctrl));

// ── Notes de frais ────────────────────────────────────────────────────────────
router.get("/expenses",    ctrl.getMyExpenses.bind(ctrl));
router.post("/expenses",   ctrl.createExpense.bind(ctrl));
router.post("/expenses/upload", receiptUpload.single("file"), ctrl.uploadReceipt.bind(ctrl));

// ── Avantages CSE ─────────────────────────────────────────────────────────────
router.get("/benefits/categories",           ctrl.getBenefitCategories.bind(ctrl));
router.get("/benefits/balance",              ctrl.getBenefitBalance.bind(ctrl));
router.get("/benefits/requests",             ctrl.getMyBenefitRequests.bind(ctrl));
router.post("/benefits/requests",            ctrl.submitBenefitRequest.bind(ctrl));
router.patch("/benefits/requests/:id/cancel", ctrl.cancelBenefitRequest.bind(ctrl));

// ── Profil ────────────────────────────────────────────────────────────────────
router.get("/profile",     ctrl.getProfile.bind(ctrl));
router.patch("/profile",   ctrl.updateProfile.bind(ctrl));
router.post("/avatar",     logoUpload.single("file"), ctrl.uploadAvatar.bind(ctrl));
router.get("/activity-log", ctrl.getActivityLog.bind(ctrl));

// ── Documents ─────────────────────────────────────────────────────────────────
router.get("/documents",         ctrl.getDocuments.bind(ctrl));
router.post("/documents",        ctrl.addDocument.bind(ctrl));
router.delete("/documents/:id",  ctrl.deleteDocument.bind(ctrl));

export default router;
