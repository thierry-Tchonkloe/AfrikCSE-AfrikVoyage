import { TravelRewardRepository } from "../infrastructure/travel-reward.repository";

const repo = new TravelRewardRepository();

export class TravelRewardService {
    async getMyRewards(userId: string) { return repo.findByUser(userId); }
    async getBalance(userId: string)   { return repo.getBalance(userId); }

    // Appelé par le service Travel quand actualCost < estimatedCost
    async earn(data: {
        organizationId:  string;
        userId:          string;
        travelRequestId: string;
        estimatedCost:   number;
        actualCost:      number;
        currency?:       string;
    }) {
        const saved = data.estimatedCost - data.actualCost;
        if (saved <= 0) return null;

        // 1 point par tranche de 1000 XOF économisés
        const points = Math.floor(saved / 1000);
        if (points <= 0) return null;

        return repo.earn({
            ...data,
            points,
            reason:     "ECONOMY_BOOKING",
            savedAmount: saved,
        });
    }
}
