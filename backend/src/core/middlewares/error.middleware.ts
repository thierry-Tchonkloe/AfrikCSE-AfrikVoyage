// core/middlewares/error.middleware.ts

import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { AppError } from "../errors/app.error";
import { logger } from "../utils/logger";

export function errorMiddleware(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
        success: false,
        message: err.message,
        });
        return;
    }

    // Multer : fichier trop volumineux, champ inattendu, etc.
    if (err instanceof MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "Fichier trop volumineux (max 5 Mo)"
            : "Échec de l'upload du fichier";
        res.status(400).json({ success: false, message });
        return;
    }

    // Prisma: record not found
    if ((err as any).code === "P2025") {
        res.status(404).json({ success: false, message: "Ressource introuvable" });
        return;
    }

    logger.error({ err }, "Unhandled error");
    res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
    });
}