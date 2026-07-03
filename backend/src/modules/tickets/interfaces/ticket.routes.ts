import { Router } from "express";
import { TicketController } from "./ticket.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new TicketController();

// POST /validate ne nécessite pas d'auth (scan par terminal/agent externe)
// mais toutes les autres routes nécessitent une session
router.post("/validate", ctrl.validate.bind(ctrl));

router.use(authenticate);

router.post("/generate",   ctrl.generate.bind(ctrl));
router.get("/",            ctrl.getMyTickets.bind(ctrl));
router.get("/:code",       ctrl.getByCode.bind(ctrl));
router.delete("/:id",      ctrl.cancel.bind(ctrl));

export default router;
