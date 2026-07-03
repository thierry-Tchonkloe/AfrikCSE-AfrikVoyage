import { Request, Response } from "express";
import { TravelRewardService } from "../application/travel-reward.service";

const service = new TravelRewardService();

export class TravelRewardController {
    async getMyRewards(req: Request, res: Response): Promise<void> {
        const rewards = await service.getMyRewards(req.user!.userId);
        res.json(rewards);
    }

    async getBalance(req: Request, res: Response): Promise<void> {
        const points = await service.getBalance(req.user!.userId);
        res.json({ points });
    }
}
