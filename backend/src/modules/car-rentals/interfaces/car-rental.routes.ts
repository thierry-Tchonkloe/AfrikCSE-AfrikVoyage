import { Router } from "express";
import * as ctrl from "./car-rental.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();

router.use(authenticate);

router.get("/search", ctrl.search);
router.get("/cities",  ctrl.cities);

router.get(   "/admin/vehicles",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListVehicles);
router.post(  "/admin/vehicles",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateVehicle);
router.patch( "/admin/vehicles/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminUpdateVehicle);
router.delete("/admin/vehicles/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), validateParams(idParamString), ctrl.adminDeleteVehicle);

export default router;
