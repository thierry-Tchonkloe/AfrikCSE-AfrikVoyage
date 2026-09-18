import { Router } from "express";
import * as ctrl from "./hotel.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { requireModule } from "../../../core/middlewares/requireModule.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { ROLES } from "../../../shared/types";

const router = Router();

router.use(authenticate);

// ── Recherche employé ────────────────────────────────────────────────────────
// requireModule uniquement ici, jamais sur /admin/* ci-dessous (catalogue géré
// au niveau plateforme, indépendant du module Voyage de l'org du SUPER_ADMIN).
router.get("/search", requireModule("VOYAGE"), ctrl.search);
router.get("/cities",  requireModule("VOYAGE"), ctrl.cities);

// ── Admin — propriétés ────────────────────────────────────────────────────────
router.get(   "/admin/properties",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.adminListProperties);
router.post(  "/admin/properties",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), idempotency(), ctrl.adminCreateProperty);
router.patch( "/admin/properties/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminUpdateProperty);
router.delete("/admin/properties/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminDeleteProperty);

// ── Admin — types de chambre ──────────────────────────────────────────────────
router.get(   "/admin/properties/:hotelId/room-types", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(ctrl.hotelIdParam), ctrl.adminListRoomTypes);
router.post(  "/admin/room-types",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), idempotency(), ctrl.adminCreateRoomType);
router.patch( "/admin/room-types/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminUpdateRoomType);
router.delete("/admin/room-types/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminDeleteRoomType);

export default router;
