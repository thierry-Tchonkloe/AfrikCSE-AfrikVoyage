import { Router } from "express";
import { EmployeeSpaceController } from "./employee-space.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new EmployeeSpaceController();

router.use(authenticate);

// Dashboard
router.get("/dashboard",   ctrl.getDashboard.bind(ctrl));

// Mes voyages
router.get("/travels",     ctrl.getMyTravels.bind(ctrl));
router.post("/travels",    ctrl.createTravel.bind(ctrl));

// Notes de frais
router.get("/expenses",    ctrl.getMyExpenses.bind(ctrl));
router.post("/expenses",   ctrl.createExpense.bind(ctrl));

// Profile
router.get("/profile",     ctrl.getProfile.bind(ctrl));
router.patch("/profile",   ctrl.updateProfile.bind(ctrl));

// Documents
router.get("/documents",         ctrl.getDocuments.bind(ctrl));
router.post("/documents",        ctrl.addDocument.bind(ctrl));
router.delete("/documents/:id",  ctrl.deleteDocument.bind(ctrl));

export default router;