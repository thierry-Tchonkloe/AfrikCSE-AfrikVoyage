import { Router } from "express";
import { CatalogController } from "./catalog.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl = new CatalogController();

router.use(authenticate);

router.get("/",            ctrl.getAll.bind(ctrl));
router.get("/categories",  ctrl.getCategories.bind(ctrl));
router.get("/:id",         ctrl.getById.bind(ctrl));

export default router;