import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";
import { IdParamString } from "../../../core/validators/param.validators";

const uploadSchema = z.object({
    fileUrl:        z.string().url("URL de fichier invalide"),
    expenseReportId: z.string().optional(),
});

export class OcrController {
    async upload(req: Request, res: Response): Promise<void> {
        const parsed = uploadSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }

        const { fileUrl, expenseReportId } = parsed.data;
        const userId         = req.user!.userId;
        const organizationId = req.user!.organizationId!;

        if (expenseReportId) {
            const report = await prisma.expenseReport.findFirst({ where: { id: expenseReportId, employee: { userId } } });
            if (!report) { res.status(404).json({ message: "Rapport de frais introuvable" }); return; }
        }

        // Enregistrement du scan + simulation extraction (stub — env OCR_PROVIDER non requis en V2)
        const scan = await prisma.ocrScan.create({
            data: {
                userId,
                organizationId,
                fileUrl,
                expenseReportId: expenseReportId ?? null,
                status:        "PROCESSING",
            },
        });

        // Simulation OCR asynchrone (stub synchrone pour V2 — remplacer par queue BullMQ en V3)
        const mockExtracted = {
            amount:   null as number | null,
            date:     null as string | null,
            vendor:   null as string | null,
            currency: "XOF",
            confidence: 0,
            note: "OCR non configuré — intégrez OCR_PROVIDER pour une extraction réelle",
        };

        const updated = await prisma.ocrScan.update({
            where: { id: scan.id },
            data: {
                status:        "DONE",
                extractedData: mockExtracted as any,
            },
        });

        res.status(201).json(updated);
    }

    async getMyScans(req: Request, res: Response): Promise<void> {
        const scans = await prisma.ocrScan.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: "desc" },
        });
        res.json(scans);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        const scan = await prisma.ocrScan.findFirst({
            where: { id: req.params.id, userId: req.user!.userId },
        });
        if (!scan) throw new AppError("Scan introuvable", 404);
        res.json(scan);
    }
}
