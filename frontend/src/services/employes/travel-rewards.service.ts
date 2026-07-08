import api from "@/lib/api";
import { TravelReward } from "@/types";

function cfg() {
    return { withCredentials: true };
}

export const travelRewardsService = {
    async getMyRewards(): Promise<TravelReward[]> {
        const { data } = await api.get(`/travel-rewards`, cfg());
        return data;
    },
    async getBalance(): Promise<number> {
        const { data } = await api.get(`/travel-rewards/balance`, cfg());
        return data.points;
    },
};
