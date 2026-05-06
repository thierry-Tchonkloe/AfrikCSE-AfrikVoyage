import { Request, Response } from "express";
import { BenefitService } from "../application/benefit.service";

const service = new BenefitService();

export class BenefitController {
    // ── Catégories ──
    async getCategories(req: Request, res: Response): Promise<void> {
        const data = await service.getCategories(req.user!.organizationId!);
        res.json(data);
    }

    async createCategory(req: Request, res: Response): Promise<void> {
        try {
        const cat = await service.createCategory(req.user!.organizationId!, req.body);
        res.status(201).json(cat);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updateCategory(req: Request, res: Response): Promise<void> {
        try {
        const cat = await service.updateCategory(req.params.id as string, req.body);
        res.json(cat);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async deleteCategory(req: Request, res: Response): Promise<void> {
        try {
        await service.deleteCategory(req.params.id as string);
        res.json({ message: "Catégorie supprimée" });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    // ── Demandes ──
    async getRequests(req: Request, res: Response): Promise<void> {
        const { status, categoryId, urgency, page, limit } = req.query;
        const data = await service.getRequests(req.user!.organizationId!, {
        status: status as string,
        categoryId: categoryId as string,
        urgency: urgency as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 10,
        });
        res.json(data);
    }

    async getApprovalStats(req: Request, res: Response): Promise<void> {
        const stats = await service.getApprovalStats(req.user!.organizationId!);
        res.json(stats);
    }

    async approveRequest(req: Request, res: Response): Promise<void> {
        try {
        const result = await service.approveRequest(req.params.id as string, req.user!.userId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async rejectRequest(req: Request, res: Response): Promise<void> {
        try {
        const result = await service.rejectRequest(req.params.id as string, req.body.note);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async bulkApprove(req: Request, res: Response): Promise<void> {
        try {
        const result = await service.bulkApprove(req.body.ids, req.user!.userId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getBudgetReport(req: Request, res: Response): Promise<void> {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const data = await service.getBudgetReport(req.user!.organizationId!, year);
        res.json(data);
    }
}