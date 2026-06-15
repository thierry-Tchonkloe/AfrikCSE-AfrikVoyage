import multer from "multer";
import { AppError } from "../errors/app.error";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml", "image/webp"];

export const receiptUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(new AppError("Format de fichier non supporté (PDF, JPG ou PNG uniquement)", 400));
            return;
        }
        cb(null, true);
    },
});

export const logoUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 Mo
    fileFilter: (_req, file, cb) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
            cb(new AppError("Format d'image non supporté (JPG, PNG, SVG ou WEBP uniquement)", 400));
            return;
        }
        cb(null, true);
    },
});
