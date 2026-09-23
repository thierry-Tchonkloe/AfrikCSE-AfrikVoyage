import { Router } from "express";
import * as ctrl from "./flight.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { requireModule } from "../../../core/middlewares/requireModule.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { ROLES } from "../../../shared/types";

const router = Router();

router.use(authenticate);

// ── Recherche employé ────────────────────────────────────────────────────────
// requireModule uniquement ici, jamais sur /admin/* ci-dessous : le catalogue
// est géré par le SUPER_ADMIN/PLATFORM_MANAGER au niveau plateforme, pour
// toutes les organisations — indépendant du module Voyage de LEUR PROPRE org.
router.get("/search",   requireModule("VOYAGE"), ctrl.search);
router.get("/airports", requireModule("VOYAGE"), ctrl.airports);

// ── Admin — routes ────────────────────────────────────────────────────────────
router.get(   "/admin/routes",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.adminListRoutes);
router.post(  "/admin/routes",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), idempotency(), ctrl.adminCreateRoute);
router.patch( "/admin/routes/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminUpdateRoute);
router.delete("/admin/routes/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminDeleteRoute);

// ── Admin — aéroports ─────────────────────────────────────────────────────────
router.get(   "/admin/airports",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.adminListAirports);
router.post(  "/admin/airports",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.adminCreateAirport);
router.patch( "/admin/airports/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminUpdateAirport);
router.delete("/admin/airports/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminDeleteAirport);

export default router;
