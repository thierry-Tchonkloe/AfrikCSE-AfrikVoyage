import { Request, Response } from "express";
import { SettingsService } from "../application/settings.service";
import { updateSettingsSchema } from "./settings.validator";

const service = new SettingsService();

export class SettingsController {
    async get(_req: Request, res: Response): Promise<void> {
        const settings = await service.get();
        res.json(settings);
    }

    async update(req: Request, res: Response): Promise<void> {
        const parsed = updateSettingsSchema.safeParse(req.body);
        if (!parsed.success) {
        res.status(400).json({ errors: parsed.error.flatten() });
        return;
        }
        try {
        const settings = await service.update(parsed.data);
        res.json(settings);
        } catch (err: any) {
        res.status(400).json({ message: err.message });
        }
    }

    async getDashboard(_req: Request, res: Response): Promise<void> {
        const data = await service.getDashboardData();
        res.json(data);
    }
}