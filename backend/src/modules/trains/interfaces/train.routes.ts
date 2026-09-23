import { Router } from "express";
import * as ctrl from "./train.controller";
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

router.get(   "/admin/routes",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), ctrl.adminListRoutes);
router.post(  "/admin/routes",     authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), idempotency(), ctrl.adminCreateRoute);
router.patch( "/admin/routes/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminUpdateRoute);
router.delete("/admin/routes/:id", authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER), validateParams(idParamString), ctrl.adminDeleteRoute);

export default router;
