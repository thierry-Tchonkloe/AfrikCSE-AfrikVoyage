import { Request, Response } from "express";
import { CatalogRepository } from "../infrastructure/catalog.repository";
import {
    createCatalogItemSchema,
    updateCatalogItemSchema,
    filterCatalogSchema,
} from "./catalog.validator";
import { IdParamString } from "../../../core/validators/param.validators";

const repo = new CatalogRepository();

export class CatalogController {
    // ─── Employee routes ──────────────────────────────────────────────────────

    async getAll(req: Request, res: Response): Promise<void> {
        const parsed = filterCatalogSchema.safeParse(req.query);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        const items = await repo.getAll(req.user!.organizationId!, parsed.data);
        res.json(items);
    }

    async getFeatured(req: Request, res: Response): Promise<void> {
        const items = await repo.getFeatured(req.user!.organizationId!);
        res.json(items);
    }

    async getCommitteeChoices(req: Request, res: Response): Promise<void> {
        const items = await repo.getCommitteeChoices(req.user!.organizationId!);
        res.json(items);
    }

    async getNew(req: Request, res: Response): Promise<void> {
        const items = await repo.getNew(req.user!.organizationId!);
        res.json(items);
    }

    async getById(req: Request<IdParamString>, res: Response): Promise<void> {
        const item = await repo.getById(req.params.id, req.user!.organizationId!);
        if (!item) { res.status(404).json({ message: "Introuvable" }); return; }
        res.json(item);
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        const cats = await repo.getCategories(req.user!.organizationId!);
        res.json(cats);
    }

    // ─── Admin routes ─────────────────────────────────────────────────────────

    async getAllAdmin(req: Request, res: Response): Promise<void> {
        const items = await repo.getAllAdmin(req.user!.organizationId!);
        res.json(items);
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createCatalogItemSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const item = await repo.create(
                req.user!.organizationId!,
                req.user!.userId,
                parsed.data as any
            );
            res.status(201).json(item);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async update(req: Request<IdParamString>, res: Response): Promise<void> {
        const parsed = updateCatalogItemSchema.safeParse(req.body);
        if (!parsed.success) {
            res.status(400).json({ errors: parsed.error.flatten() });
            return;
        }
        try {
            const item = await repo.update(req.params.id, req.user!.userId, req.user!.organizationId!, parsed.data as any);
            if (!item) { res.status(404).json({ message: "Introuvable" }); return; }
            res.json(item);
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async delete(req: Request<IdParamString>, res: Response): Promise<void> {
        try {
            const deleted = await repo.delete(req.params.id, req.user!.userId, req.user!.organizationId!);
            if (!deleted) { res.status(404).json({ message: "Introuvable" }); return; }
            res.json({ message: "Offre supprimée" });
        } catch (err: any) {
            res.status(err.statusCode ?? 500).json({ message: err.message });
        }
    }

    async getAuditHistory(req: Request<IdParamString>, res: Response): Promise<void> {
        const history = await repo.getAuditHistory(req.params.id, req.user!.organizationId!);
        res.json(history);
    }
}
