import { Request, Response } from "express";
import { EventRepository } from "../infrastructure/event.repository";

const repo = new EventRepository();

export class EventController {
    async getAll(req: Request, res: Response): Promise<void> {
        const month = req.query.month !== undefined ? parseInt(req.query.month as string) : undefined;
        const year  = req.query.year  !== undefined ? parseInt(req.query.year as string)  : undefined;
        const events = await repo.getAll(req.user!.organizationId!, month, year);
        res.json(events);
    }

    async getUpcoming(req: Request, res: Response): Promise<void> {
        const events = await repo.getUpcoming(req.user!.organizationId!);
        res.json(events);
    }

    async getStats(req: Request, res: Response): Promise<void> {
        const stats = await repo.getStats(req.user!.organizationId!);
        res.json(stats);
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
        const event = await repo.create(
            req.user!.organizationId!,
            req.user!.userId,
            {
            ...req.body,
            startDate: new Date(req.body.startDate),
            endDate:   new Date(req.body.endDate),
            }
        );
        res.status(201).json(event);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async register(req: Request, res: Response): Promise<void> {
        try {
        await repo.register(req.params.id as string, req.user!.userId);
        res.json({ success: true });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async unregister(req: Request, res: Response): Promise<void> {
        try {
        await repo.unregister(req.params.id as string, req.user!.userId);
        res.json({ success: true });
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }
}