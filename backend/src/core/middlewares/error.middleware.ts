// core/middlewares/error.middleware.ts

import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";

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

    // Prisma: record not found
    if ((err as any).code === "P2025") {
        res.status(404).json({ success: false, message: "Ressource introuvable" });
        return;
    }

    console.error("[Unhandled Error]", err);
    res.status(500).json({
        success: false,
        message: "Erreur interne du serveur",
    });
}