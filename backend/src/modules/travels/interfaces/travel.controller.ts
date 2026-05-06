import { Request, Response } from "express";
import { TravelRepository } from "../infrastructure/travel.repository";
import { RequestStatus } from "@prisma/client";

const repo = new TravelRepository();

export class TravelController {
    async getAll(req: Request, res: Response): Promise<void> {
        const { status, department, page, limit } = req.query;
        const data = await repo.getAll(req.user!.organizationId!, {
        status: status as RequestStatus,
        department: department as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        });
        res.json(data);
    }

    async getStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getStats(req.user!.organizationId!);
        res.json(stats);
    }

    async approve(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.approve(req.params.id as string, req.user!.userId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async reject(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.reject(req.params.id as string, req.body.note);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getExpenses(req: Request, res: Response): Promise<void> {
        const { status, department, page, limit } = req.query;
        const data = await repo.getExpenses(req.user!.organizationId!, {
        status: status as RequestStatus,
        department: department as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        });
        res.json(data);
    }

    async getExpenseStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getExpenseStats(req.user!.organizationId!);
        res.json(stats);
    }

    async approveExpense(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.approveExpense(req.params.id as string, req.user!.userId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async rejectExpense(req: Request, res: Response): Promise<void> {
        try {
        const result = await repo.rejectExpense(req.params.id as string, req.body.note);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}