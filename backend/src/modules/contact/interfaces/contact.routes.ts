// modules/contact/interfaces/contact.routes.ts

import { Router, Request, Response, NextFunction } from "express";
import { ContactController } from "./contact.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idempotency } from "../../../core/middlewares/idempotency.middleware";
import { idParamInt, IdParamInt } from "../../../core/validators/param.validators";
import { authenticate, authorize } from "../../../core/middlewares/auth.middleware";
import { ROLES } from "../../../shared/types";

const router = Router();
const controller = new ContactController();

// Public routes
router.post("/", idempotency(), (req: Request, res: Response, next: NextFunction) => controller.create(req, res, next));

// Admin-protected routes — demandes de contact = prospects plateforme, gérées
// par l'équipe plateforme uniquement (pas les admins des organisations clientes).
// Montés via router.use() (plutôt qu'en arguments inline des routes génériques
// ci-dessous) pour éviter un conflit d'inférence TypeScript entre le type
// `Request` non générique de `authenticate`/`authorize` et le `Request<IdParamInt>`
// de la route PATCH typée.
router.use(authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.PLATFORM_MANAGER));

router.get(
    "/",
    (req: Request, res: Response, next: NextFunction) => controller.findAll(req, res, next)
);

router.patch<IdParamInt>(
    "/:id/status",
    validateParams(idParamInt),
    controller.updateStatus.bind(controller)
);

export default router;