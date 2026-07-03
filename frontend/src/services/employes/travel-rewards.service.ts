import axios from "axios";
import { TravelReward } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const travelRewardsService = {
    async getMyRewards(): Promise<TravelReward[]> {
        const { data } = await axios.get(`${BASE}/api/travel-rewards`, { withCredentials: true });
        return data;
    },
    async getBalance(): Promise<number> {
        const { data } = await axios.get(`${BASE}/api/travel-rewards/balance`, { withCredentials: true });
        return data.points;
    },
};
