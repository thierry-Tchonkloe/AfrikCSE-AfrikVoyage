import { Router } from "express";
import { CatalogController } from "./catalog.controller";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new CatalogController();

router.use(authenticate);

// ── Employee — lecture seule ─────────────────────────────────────────────────
// /admin doit être défini AVANT /:id pour ne pas être capturé par la route param
router.get("/featured",   ctrl.getFeatured.bind(ctrl));
router.get("/committee",  ctrl.getCommitteeChoices.bind(ctrl));
router.get("/new",        ctrl.getNew.bind(ctrl));
router.get("/categories", ctrl.getCategories.bind(ctrl));

// ── Admin — gestion des offres ───────────────────────────────────────────────
router.get(
    "/admin",
    authorize("ADMIN", "MANAGER", "SUPER_ADMIN"),
    ctrl.getAllAdmin.bind(ctrl)
);
router.post(
    "/",
    authorize("ADMIN", "MANAGER", "SUPER_ADMIN"),
    ctrl.create.bind(ctrl)
);
router.patch(
    "/:id",
    authorize("ADMIN", "MANAGER", "SUPER_ADMIN"),
    ctrl.update.bind(ctrl)
);
router.delete(
    "/:id",
    authorize("ADMIN", "MANAGER", "SUPER_ADMIN"),
    ctrl.delete.bind(ctrl)
);
router.get(
    "/:id/audit",
    authorize("ADMIN", "MANAGER", "SUPER_ADMIN"),
    ctrl.getAuditHistory.bind(ctrl)
);

// ── Employee — détail d'une offre (après les routes admin pour éviter le conflit) ─
router.get("/",    ctrl.getAll.bind(ctrl));
router.get("/:id", ctrl.getById.bind(ctrl));

export default router;
