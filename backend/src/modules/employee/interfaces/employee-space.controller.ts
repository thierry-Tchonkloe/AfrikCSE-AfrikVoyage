import { Request, Response } from "express";
import { EmployeeDashboardRepository } from "../infrastructure/employee-dashboard.repository";
import { prisma } from "../../../core/config/prisma";
import { cloudinary } from "../../../core/config/cloudinary";
import { UploadApiResponse } from "cloudinary";

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

    async createTravel(req: Request, res: Response): Promise<void> {
        try {
            const travel = await repo.createTravelRequest(
                req.user!.userId,
                req.user!.organizationId!,
                {
                    ...req.body,
                    departureDate: new Date(req.body.departureDate),
                    returnDate: new Date(req.body.returnDate),
                }
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
        try {
            const { expenseDate, departureDate, returnDate, ...rest } = req.body;
            const expense = await repo.createExpense(
                req.user!.userId,
                req.user!.organizationId!,
                {
                    ...rest,
                    expenseDate: expenseDate ? new Date(expenseDate) : undefined,
                    departureDate: departureDate ? new Date(departureDate) : undefined,
                    returnDate: returnDate ? new Date(returnDate) : undefined,
                }
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
        try {
            const request = await repo.createBenefitRequest(
                req.user!.userId,
                req.user!.organizationId!,
                req.body
            );
            res.status(201).json(request);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async cancelBenefitRequest(req: Request, res: Response): Promise<void> {
        try {
            await repo.cancelBenefitRequest(req.params.id as string, req.user!.userId);
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
        try {
            const user = await repo.updateProfile(req.user!.userId, req.body);
            res.json(user);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    // ── Documents ─────────────────────────────────────────────────────────────

    async getDocuments(req: Request, res: Response): Promise<void> {
        const docs = await repo.getDocuments(req.user!.userId);
        res.json(docs);
    }

    async addDocument(req: Request, res: Response): Promise<void> {
        try {
            const doc = await repo.addDocument(req.user!.userId, req.body);
            res.status(201).json(doc);
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }

    async deleteDocument(req: Request, res: Response): Promise<void> {
        try {
            await repo.deleteDocument(req.params.id as string, req.user!.userId);
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ message: err.message });
        }
    }
}
