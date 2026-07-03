import { Router } from "express";
import { OcrController } from "./ocr.controller";
import { authenticate } from "../../../core/middlewares/auth.middleware";

const router = Router();
const ctrl   = new OcrController();

router.use(authenticate);

router.post("/upload", ctrl.upload.bind(ctrl));
router.get("/",        ctrl.getMyScans.bind(ctrl));
router.get("/:id",     ctrl.getById.bind(ctrl));

export default router;
