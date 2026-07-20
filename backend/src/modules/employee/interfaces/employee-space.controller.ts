import { Request, Response } from "express";
import { EmployeeDashboardRepository } from "../infrastructure/employee-dashboard.repository";
import { SavingsRepository } from "../../savings/infrastructure/savings.repository";
import { prisma } from "../../../core/config/prisma";
import { createHmac } from "crypto";
import { cloudinary } from "../../../core/config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";
import { logAudit } from "../../../core/utils/audit";
import {
    createTravelRequestSchema,
    createExpenseSchema,
    submitBenefitRequestSchema,
    updateProfileSchema,
    addDocumentSchema,
} from "./employee-space.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new EmployeeDashboardRepository();
const notificationRepo = new NotificationRepository();

export class EmployeeSpaceController {

    // ── Dashboard ─────────────────────────────────────────────────────────────

    async getDashboard(req: Request, res: Response): Promise<void> {
        try {
            const data = await repo.getDashboardData(
                req.user!.userId,
                req.user!.organizationId!
            );
            res.json(data);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    // ── Voyages ───────────────────────────────────────────────────────────────

    async getMyTravels(req: Request, res: Response): Promise<void> {
        const travels = await repo.getMyTravels(req.user!.userId);
        res.json(travels);
    }

    async createTravel(req: Request, res: Response): Promise<void> {
        const parsed = createTravelRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const travel = await repo.createTravelRequest(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data
            );

            await notificationRepo.createForRoles(
                req.user!.organizationId!,
                ["ADMIN", "MANAGER"],
                "Nouvelle demande de voyage",
                `Une nouvelle demande de voyage pour ${travel.destination} est en attente d'approbation.`,
                "APPROVAL_REQUEST",
                "/companies/AfrikVoyage/approbations"
            );

            res.status(201).json(travel);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Notes de frais ────────────────────────────────────────────────────────

    async getMyExpenses(req: Request, res: Response): Promise<void> {
        const expenses = await repo.getMyExpenses(req.user!.userId);
        res.json(expenses);
    }

    async createExpense(req: Request, res: Response): Promise<void> {
        const parsed = createExpenseSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const expense = await repo.createExpense(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data
            );

            await notificationRepo.createForRoles(
                req.user!.organizationId!,
                ["ADMIN", "MANAGER"],
                "Nouvelle note de frais",
                `Une nouvelle note de frais « ${expense.title} » est en attente d'approbation.`,
                "APPROVAL_REQUEST",
                "/companies/AfrikVoyage/frais"
            );

            res.status(201).json(expense);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async uploadReceipt(req: Request, res: Response): Promise<void> {
        if (!req.file) {
            res.status(400).json({ message: "Aucun fichier fourni" });
            return;
        }

        try {
            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `afrikcse/receipts/${req.user!.organizationId}`,
                        resource_type: "auto",
                    },
                    (err, uploadResult) => {
                        if (err || !uploadResult) reject(err ?? new Error("Échec de l'upload"));
                        else resolve(uploadResult);
                    }
                );
                stream.end(req.file!.buffer);
            });

            res.status(201).json({
                url: result.secure_url,
                name: req.file.originalname,
                size: `${(req.file.size / 1024 / 1024).toFixed(1)} MB`,
            });
        } catch (err: any) {
            res.status(500).json({ message: err.message ?? "Échec de l'upload du fichier" });
        }
    }

    // ── Avantages (CSE) ───────────────────────────────────────────────────────

    async getBenefitCategories(req: Request, res: Response): Promise<void> {
        try {
            const categories = await repo.getBenefitCategoriesForEmployee(
                req.user!.organizationId!,
                req.user!.userId
            );
            res.json(categories);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    async getMyBenefitRequests(req: Request, res: Response): Promise<void> {
        try {
            const requests = await repo.getMyBenefitRequests(req.user!.userId);
            res.json(requests);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    async submitBenefitRequest(req: Request, res: Response): Promise<void> {
        const parsed = submitBenefitRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const request = await repo.createBenefitRequest(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data
            );

            await notificationRepo.createForRoles(
                req.user!.organizationId!,
                ["ADMIN", "MANAGER", "RH"],
                "Nouvelle demande d'avantage",
                `Une nouvelle demande « ${request.category.name} » est en attente d'approbation.`,
                "APPROVAL_REQUEST",
                "/companies/AfrikCSE/avantages"
            );

            res.status(201).json(request);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async cancelBenefitRequest(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await repo.cancelBenefitRequest(req.params.id, req.user!.userId);
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async getBenefitBalance(req: Request, res: Response): Promise<void> {
        try {
            const balance = await repo.getBenefitBalance(
                req.user!.userId,
                req.user!.organizationId!
            );
            res.json(balance);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    // ── Profil ────────────────────────────────────────────────────────────────

    async getProfile(req: Request, res: Response): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                organization: { select: { name: true } },
                employee: {
                    include: { manager: { include: { user: true } } },
                },
                documents: true,
            },
        });
        res.json(user);
    }

    async updateProfile(req: Request, res: Response): Promise<void> {
        const parsed = updateProfileSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const user = await repo.updateProfile(req.user!.userId, parsed.data);
            await logAudit({
                action: "USER_PROFILE_UPDATED",
                entity: "User",
                entityId: req.user!.userId,
                userId: req.user!.userId,
                organizationId: req.user!.organizationId,
                newValue: parsed.data,
                req,
            });
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Journal d'activité ───────────────────────────────────────────────────

    async getActivityLog(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const data = await repo.getActivityLog(req.user!.userId, page, limit);
        res.json(data);
    }

    async uploadAvatar(req: Request, res: Response): Promise<void> {
        if (!req.file) {
            res.status(400).json({ message: "Aucun fichier fourni" });
            return;
        }

        try {
            const result = await new Promise<UploadApiResponse>((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: `afrikcse/avatars/${req.user!.organizationId}`,
                        resource_type: "image",
                    },
                    (err, uploadResult) => {
                        if (err || !uploadResult) reject(err ?? new Error("Échec de l'upload"));
                        else resolve(uploadResult);
                    }
                );
                stream.end(req.file!.buffer);
            });

            const user = await repo.updateProfile(req.user!.userId, { avatar: result.secure_url });
            res.json({ avatar: user.avatar });
        } catch (err: any) {
            res.status(500).json({ message: err.message ?? "Échec de l'upload de la photo" });
        }
    }

    // ── Documents ─────────────────────────────────────────────────────────────

    async getDocuments(req: Request, res: Response): Promise<void> {
        const docs = await repo.getDocuments(req.user!.userId);
        res.json(docs);
    }

    async addDocument(req: Request, res: Response): Promise<void> {
        const parsed = addDocumentSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const doc = await repo.addDocument(req.user!.userId, parsed.data);
            res.status(201).json(doc);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async deleteDocument(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            await repo.deleteDocument(req.params.id, req.user!.userId);
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Carte de membre numérique ─────────────────────────────────────────────

    async getMemberCard(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user!.userId;
            const orgId  = req.user!.organizationId!;

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true, email: true, firstName: true, lastName: true,
                    createdAt: true, avatar: true,
                    organization: { select: { id: true, name: true, logoUrl: true } },
                    employee: { select: { matricule: true } },
                },
            });
            if (!user) { res.status(404).json({ message: "Utilisateur introuvable" }); return; }

            const secret = process.env.JWT_SECRET ?? "change-me";
            const payload = `${userId}:${orgId}:${user.createdAt.getTime()}`;
            const qrData  = createHmac("sha256", secret).update(payload).digest("hex");

            const memberId = user.employee?.matricule
                ?? `MBR-${userId.slice(-6).toUpperCase()}`;

            res.json({
                memberId,
                firstName:   user.firstName,
                lastName:    user.lastName,
                email:       user.email,
                avatar:      user.avatar,
                orgName:     user.organization?.name ?? "",
                orgLogoUrl:  user.organization?.logoUrl ?? null,
                memberSince: user.createdAt.toISOString().slice(0, 10),
                qrData,
            });
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }

    // ── Dashboard économies ───────────────────────────────────────────────────

    async getMySavings(req: Request, res: Response): Promise<void> {
        try {
            const savingsRepo = new SavingsRepository();
            const data = await savingsRepo.getMySavings(
                req.user!.userId,
                req.user!.organizationId!
            );
            res.json(data);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}
