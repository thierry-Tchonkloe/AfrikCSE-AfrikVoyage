import { Request, Response } from "express";
import { SavingsRepository } from "../infrastructure/savings.repository";

const repo = new SavingsRepository();

export class SavingsController {
    async getMySavings(req: Request, res: Response): Promise<void> {
        try {
            const data = await repo.getMySavings(
                req.user!.userId,
                req.user!.organizationId!
            );
            res.json(data);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}
