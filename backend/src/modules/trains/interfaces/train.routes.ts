import { Router } from "express";
import * as ctrl from "./train.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();

router.use(authenticate);

router.get("/search", ctrl.search);
router.get("/cities",  ctrl.cities);

router.get(   "/admin/routes",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListRoutes);
router.post(  "/admin/routes",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateRoute);
router.patch( "/admin/routes/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminUpdateRoute);
router.delete("/admin/routes/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminDeleteRoute);

export default router;
