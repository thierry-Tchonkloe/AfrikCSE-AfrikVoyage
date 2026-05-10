import { Request, Response } from "express";
import { EmployeeDashboardRepository } from "../infrastructure/employee-dashboard.repository";
import { prisma } from "../../../core/config/prisma";

const repo = new EmployeeDashboardRepository();

export class EmployeeSpaceController {
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

    async getMyExpenses(req: Request, res: Response): Promise<void> {
        const expenses = await repo.getMyExpenses(req.user!.userId);
        res.json(expenses);
    }

    async createExpense(req: Request, res: Response): Promise<void> {
        try {
        const expense = await repo.createExpense(
            req.user!.userId,
            req.user!.organizationId!,
            req.body
        );
        res.status(201).json(expense);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

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