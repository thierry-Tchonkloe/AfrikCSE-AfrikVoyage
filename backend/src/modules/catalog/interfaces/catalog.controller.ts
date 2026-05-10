import { Request, Response } from "express";
import { CatalogRepository } from "../infrastructure/catalog.repository";

const repo = new CatalogRepository();

export class CatalogController {
    async getAll(req: Request, res: Response): Promise<void> {
        const { category, search, sortBy } = req.query;
        const items = await repo.getAll(req.user!.organizationId!, {
        category: category as string,
        search: search as string,
        sortBy: sortBy as string,
        });
        res.json(items);
    }

    async getById(req: Request, res: Response): Promise<void> {
        const item = await repo.getById(req.params.id as string);
        if (!item) { res.status(404).json({ message: "Introuvable" }); return; }
        res.json(item);
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        const cats = await repo.getCategories(req.user!.organizationId!);
        res.json(cats);
    }
}