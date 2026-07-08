import { Router } from "express";
import * as ctrl from "./hotel.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

// ── Recherche employé ────────────────────────────────────────────────────────
router.get("/search", ctrl.search);
router.get("/cities",  ctrl.cities);

// ── Admin — propriétés ────────────────────────────────────────────────────────
router.get(   "/admin/properties",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListProperties);
router.post(  "/admin/properties",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateProperty);
router.patch( "/admin/properties/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminUpdateProperty);
router.delete("/admin/properties/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminDeleteProperty);

// ── Admin — types de chambre ──────────────────────────────────────────────────
router.get(   "/admin/properties/:hotelId/room-types", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminListRoomTypes);
router.post(  "/admin/room-types",     authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminCreateRoomType);
router.patch( "/admin/room-types/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminUpdateRoomType);
router.delete("/admin/room-types/:id", authorize("SUPER_ADMIN", "PLATFORM_MANAGER"), ctrl.adminDeleteRoomType);

export default router;
