import { Router } from "express";
import { TicketController } from "./ticket.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { codeParamSchema } from "./ticket.validator";

const router = Router();
const ctrl   = new TicketController();

// POST /validate ne nécessite pas d'auth (scan par terminal/agent externe)
// mais toutes les autres routes nécessitent une session
router.post("/validate", ctrl.validate.bind(ctrl));

router.use(authenticate);

router.post("/generate",   ctrl.generate.bind(ctrl));
router.get("/",            ctrl.getMyTickets.bind(ctrl));
router.get("/:code",       validateParams(codeParamSchema), ctrl.getByCode.bind(ctrl));
router.delete("/:id",      validateParams(idParamString), ctrl.cancel.bind(ctrl));

export default router;
