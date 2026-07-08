import { Router } from "express";
import * as ctrl from "./car-rental.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/search", ctrl.search);
router.get("/cities",  ctrl.cities);

router.get(   "/admin/vehicles",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListVehicles);
router.post(  "/admin/vehicles",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateVehicle);
router.patch( "/admin/vehicles/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminUpdateVehicle);
router.delete("/admin/vehicles/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminDeleteVehicle);

export default router;
