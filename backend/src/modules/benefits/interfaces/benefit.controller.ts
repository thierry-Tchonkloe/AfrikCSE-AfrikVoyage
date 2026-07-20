import { Request, Response } from "express";
import { BenefitService } from "../application/benefit.service";
import {
    createBenefitCategorySchema,
    updateBenefitCategorySchema,
    rejectRequestSchema,
    bulkApproveSchema,
} from "./benefit.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const service = new BenefitService();

export class BenefitController {
    // ── Catégories ──
    async getCategories(req: Request, res: Response): Promise<void> {
        const data = await service.getCategories(req.user!.organizationId!);
        res.json(data);
    }

    async createCategory(req: Request, res: Response): Promise<void> {
        const parsed = createBenefitCategorySchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const cat = await service.createCategory(req.user!.organizationId!, parsed.data);
        res.status(201).json(cat);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async updateCategory(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateBenefitCategorySchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const cat = await service.updateCategory(req.params.id, req.user!.organizationId!, parsed.data);
        res.json(cat);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async deleteCategory(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        await service.deleteCategory(req.params.id, req.user!.organizationId!);
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

    async approveRequest(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
        const result = await service.approveRequest(req.params.id, req.user!.organizationId!, req.user!.userId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async rejectRequest(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = rejectRequestSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const result = await service.rejectRequest(req.params.id, req.user!.organizationId!, parsed.data.note);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async bulkApprove(req: Request, res: Response): Promise<void> {
        const parsed = bulkApproveSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const result = await service.bulkApprove(parsed.data.ids, req.user!.organizationId!, req.user!.userId);
        res.json(result);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getBudgetReport(req: Request, res: Response): Promise<void> {
        const year = parseInt(req.query.year as string) || new Date().getFullYear();
        const department = req.query.department as string | undefined;
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

        const data = await service.getBudgetReport(req.user!.organizationId!, year, { department, startDate, endDate });
        res.json(data);
    }

    async getComplianceReport(req: Request, res: Response): Promise<void> {
        const data = await service.getComplianceReport(req.user!.organizationId!);
        res.json(data);
    }
}