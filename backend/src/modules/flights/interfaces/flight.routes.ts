import { Router } from "express";
import { FlightController } from "./flight.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new FlightController();

router.use(authenticate);

router.get("/search",    ctrl.search.bind(ctrl));
router.get("/locations", ctrl.locations.bind(ctrl));

export default router;
