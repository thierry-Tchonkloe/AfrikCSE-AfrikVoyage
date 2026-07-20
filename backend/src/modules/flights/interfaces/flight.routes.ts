import { Router } from "express";
import * as ctrl from "./flight.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();

router.use(authenticate);

// ── Recherche employé ────────────────────────────────────────────────────────
router.get("/search",   ctrl.search);
router.get("/airports", ctrl.airports);

// ── Admin — routes ────────────────────────────────────────────────────────────
router.get(   "/admin/routes",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListRoutes);
router.post(  "/admin/routes",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateRoute);
router.patch( "/admin/routes/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminUpdateRoute);
router.delete("/admin/routes/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminDeleteRoute);

// ── Admin — aéroports ─────────────────────────────────────────────────────────
router.get(   "/admin/airports",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListAirports);
router.post(  "/admin/airports",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateAirport);
router.patch( "/admin/airports/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminUpdateAirport);
router.delete("/admin/airports/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminDeleteAirport);

export default router;
