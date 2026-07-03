import { Request, Response } from "express";
import { FaqService } from "../application/faq.service";
import { createFaqSchema, updateFaqSchema, voteSchema } from "./faq.validator";

const service = new FaqService();

export class FaqController {
    // Employés — lecture uniquement des PUBLISHED
    async list(req: Request, res: Response): Promise<void> {
        const entries = await service.listPublished(
            req.user!.organizationId!,
            req.query.category as string | undefined,
        );
        res.json(entries);
    }

    async getCategories(req: Request, res: Response): Promise<void> {
        const cats = await service.getCategories(req.user!.organizationId!);
        res.json(cats);
    }

    async vote(req: Request, res: Response): Promise<void> {
        const parsed = voteSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const result = await service.vote(req.params.id as string, req.user!.userId, parsed.data.helpful);
            res.json(result);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    // Admin — toutes entrées + CRUD
    async listAll(req: Request, res: Response): Promise<void> {
        const entries = await service.listAll(req.user!.organizationId!);
        res.json(entries);
    }

    async create(req: Request, res: Response): Promise<void> {
        const parsed = createFaqSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const entry = await service.create(req.user!.organizationId!, req.user!.userId, parsed.data as any);
            res.status(201).json(entry);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async update(req: Request, res: Response): Promise<void> {
        const parsed = updateFaqSchema.safeParse(req.body);
        if (!parsed.success) { res.status(400).json({ errors: parsed.error.flatten() }); return; }
        try {
            const entry = await service.update(req.params.id as string, req.user!.organizationId!, parsed.data as any);
            res.json(entry);
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            await service.delete(req.params.id as string, req.user!.organizationId!);
            res.json({ message: "Entrée FAQ supprimée" });
        } catch (err: any) { res.status(err.statusCode ?? 500).json({ message: err.message }); }
    }
}
