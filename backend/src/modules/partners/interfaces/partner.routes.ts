import { Router } from "express";
import { PartnerController } from "./partner.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl = new PartnerController();

router.use(authenticate);
router.use(authorize("SUPER_ADMIN"));

// Offres partenaires en attente de revue — routes fixes déclarées avant `/:id`
// pour ne jamais être capturées par le paramètre générique.
router.get("/offers/pending",           ctrl.listPendingOffers.bind(ctrl));
router.patch("/offers/:offerId/approve", ctrl.approveOffer.bind(ctrl));
router.patch("/offers/:offerId/reject",  ctrl.rejectOffer.bind(ctrl));

router.get("/",             ctrl.list.bind(ctrl));
router.post("/",            idempotency(), ctrl.create.bind(ctrl));
router.get("/:id",          ctrl.getById.bind(ctrl));
router.patch("/:id",        ctrl.update.bind(ctrl));
router.delete("/:id",       ctrl.delete.bind(ctrl));
router.post("/:id/sync",    idempotency(), ctrl.sync.bind(ctrl));
router.get("/:id/logs",     ctrl.getSyncLogs.bind(ctrl));

export default router;
