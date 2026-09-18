import { Request, Response } from "express";
import { EmployeeDashboardRepository } from "../infrastructure/employee-dashboard.repository";
import { SavingsRepository } from "../../savings/infrastructure/savings.repository";
import { prisma } from "../../../core/config/prisma";
import { createHmac } from "crypto";
import { cloudinary } from "../../../core/config/cloudinary";
import { UploadApiResponse } from "cloudinary";
import { dispatchNotificationToRoles, dispatchNotificationToUsers } from "../../notification/application/notification.service";
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

    /** Contexte d'un voyage approuvé — alimente le bandeau de /employes/reserver?travelRequestId=... */
    async getTravelById(req: Request<IdParamString>, res: Response): Promise<void> {
        const travel = await repo.getTravelById(req.params.id, req.user!.userId);
        if (!travel) {
            res.status(404).json({ message: "Voyage introuvable" });
            return;
        }
        res.json(travel);
    }

    async createTravel(req: Request, res: Response): Promise<void> {
        const parsed = createTravelRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const { request: travel, created, autoApproved } = await repo.createTravelRequest(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data
            );

            // Un retry (idempotencyKey déjà vue) renvoie la demande existante sans
            // renotifier une 2e fois.
            if (created) {
                if (autoApproved) {
                    // Sous le seuil de la politique de voyage : déjà approuvée, on
                    // notifie l'employé — pas les managers, il n'y a rien à approuver.
                    dispatchNotificationToUsers(
                        "REQUEST_APPROVED",
                        [travel.requestedById],
                        { requestType: "voyage", subject: travel.destination },
                        "/employes/voyages"
                    ).catch(() => {});
                } else {
                    dispatchNotificationToRoles(
                        "APPROVAL_REQUEST",
                        req.user!.organizationId!,
                        ["ADMIN", "MANAGER"],
                        { requestType: "voyage", subject: travel.destination },
                        "/companies/AfrikVoyage/approbations"
                    ).catch(() => {});
                }
            }

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
            const { expense, created } = await repo.createExpense(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data
            );

            if (created) {
                dispatchNotificationToRoles(
                    "APPROVAL_REQUEST",
                    req.user!.organizationId!,
                    ["ADMIN", "MANAGER"],
                    { requestType: "note de frais", subject: expense.title },
                    "/companies/AfrikVoyage/frais"
                ).catch(() => {});
            }

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
            const { request, created } = await repo.createBenefitRequest(
                req.user!.userId,
                req.user!.organizationId!,
                parsed.data
            );

            if (created) {
                dispatchNotificationToRoles(
                    "APPROVAL_REQUEST",
                    req.user!.organizationId!,
                    ["ADMIN", "MANAGER", "RH"],
                    { requestType: "demande d'avantage", subject: request.category.name },
                    "/companies/AfrikCSE/avantages"
                ).catch(() => {});
            }

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
        // `select` strict — jamais `include` sur `User` : un `include` renvoie TOUS
        // les champs scalaires, y compris `password` (hash bcrypt) et
        // `resetPasswordToken`/`resetPasswordExpiresAt`, interceptables par n'importe
        // quel outil réseau côté client à chaque chargement de cette page. Même
        // règle appliquée au manager imbriqué (`employee.manager.user`), qui portait
        // la même fuite.
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id:                      true,
                email:                   true,
                firstName:               true,
                lastName:                true,
                role:                    true,
                isActive:                true,
                avatar:                  true,
                phone:                   true,
                jobTitle:                true,
                department:              true,
                costCenter:              true,
                emailVerified:           true,
                emailVerifiedAt:         true,
                profileCompleted:        true,
                timezone:                true,
                dateFormat:              true,
                notificationPreferences: true,
                lastLoginAt:             true,
                createdAt:               true,
                organizationId:          true,
                organization: { select: { name: true } },
                employee: {
                    select: {
                        id:        true,
                        matricule: true,
                        avatar:    true,
                        manager: {
                            select: {
                                id:        true,
                                matricule: true,
                                user: {
                                    select: {
                                        id: true, firstName: true, lastName: true,
                                        email: true, jobTitle: true, avatar: true,
                                    },
                                },
                            },
                        },
                    },
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

            // Pas de fallback en dur : server.ts vérifie déjà JWT_SECRET au boot.
            const secret = process.env.JWT_SECRET!;
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
