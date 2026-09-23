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

        // Simulation OCR asynchrone (stub synchrone pour V2 — remplacer par un vrai
        // OCR_PROVIDER en V3). Génère une extraction plausible (montant/date/marchand)
        // pour que le formulaire employé se pré-remplisse réellement à l'écran, plutôt
        // que de renvoyer des null qui laissaient la fonctionnalité visuellement morte.
        const MOCK_VENDORS = ["Restaurant Le Palmier", "Taxi Express", "Supermarché Erevan", "Hôtel Ivoire", "Station Total"];
        const mockExtracted = {
            amount:     Math.round((3000 + Math.random() * 12000) / 100) * 100, // 3000–15000 XOF, arrondi à la centaine
            date:       new Date().toISOString().slice(0, 10),
            vendor:     MOCK_VENDORS[Math.floor(Math.random() * MOCK_VENDORS.length)],
            currency:   "XOF",
            confidence: Math.round((0.82 + Math.random() * 0.15) * 100) / 100, // 0.82–0.97
            note: "Extraction simulée — intégrez OCR_PROVIDER pour une extraction réelle",
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
