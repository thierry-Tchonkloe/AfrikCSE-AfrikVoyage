import { Router } from "express";
import { OcrController } from "./ocr.controller";
import { validateParams } from "../../../core/middlewares/params.middleware";
import { idParamString } from "../../../core/validators/param.validators";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
router.use("/:id", validateParams(idParamString));
const ctrl   = new OcrController();

router.use(authenticate);

router.post("/upload", ctrl.upload.bind(ctrl));
router.get("/",        ctrl.getMyScans.bind(ctrl));
router.get("/:id",     ctrl.getById.bind(ctrl));

export default router;
