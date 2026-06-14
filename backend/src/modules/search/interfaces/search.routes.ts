import { Router } from "express";
import { SearchController } from "./search.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new SearchController();

router.use(authenticate);

router.get("/", ctrl.search.bind(ctrl));

export default router;
