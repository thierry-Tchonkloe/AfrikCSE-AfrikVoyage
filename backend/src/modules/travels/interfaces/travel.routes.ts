import { Router } from "express";
import { TravelController } from "./travel.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new TravelController();

router.use(authenticate);

// Voyages
router.get("/",            authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), ctrl.getAll.bind(ctrl));
router.get("/stats",       authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), ctrl.getStats.bind(ctrl));
router.patch("/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.approve.bind(ctrl));
router.patch("/:id/reject",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.reject.bind(ctrl));

// Notes de frais
router.get("/expenses",             authorize("SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"), ctrl.getExpenses.bind(ctrl));
router.get("/expenses/stats",       authorize("SUPER_ADMIN", "ADMIN", "FINANCE"), ctrl.getExpenseStats.bind(ctrl));
router.patch("/expenses/:id/approve", authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.approveExpense.bind(ctrl));
router.patch("/expenses/:id/reject",  authorize("SUPER_ADMIN", "ADMIN", "MANAGER"), ctrl.rejectExpense.bind(ctrl));

export default router;