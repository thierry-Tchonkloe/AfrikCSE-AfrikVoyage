import { Router } from "express";
import * as ctrl from "./car-rental.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { requireModule } from "../../../core/middlewares/requireModule.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { ROLES } from "../../../shared/types";

const router = Router();

router.use(authenticate);

// requireModule uniquement ici, jamais sur /admin/* ci-dessous (catalogue géré
// au niveau plateforme, indépendant du module Voyage de l'org du SUPER_ADMIN).
router.get("/search", requireModule("VOYAGE"), ctrl.search);
router.get("/cities",  requireModule("VOYAGE"), ctrl.cities);

router.get(   "/admin/vehicles",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.adminListVehicles);
router.post(  "/admin/vehicles",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), idempotency(), ctrl.adminCreateVehicle);
router.patch( "/admin/vehicles/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminUpdateVehicle);
router.delete("/admin/vehicles/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminDeleteVehicle);

export default router;
