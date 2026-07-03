import axios from "axios";
import { TravelPolicy } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface TravelPolicyInput {
    name:                   string;
    description?:           string;
    isDefault?:             boolean;
    isActive?:              boolean;
    maxFlightBudget?:       number | null;
    maxHotelBudgetPerNight?: number | null;
    maxDailyAllowance?:     number | null;
    currency?:              string;
    allowedFlightClass?:    "ECONOMY" | "BUSINESS" | "FIRST" | null;
    maxAdvanceBookingDays?: number | null;
    requiresApproval?:      boolean;
    approvalThreshold?:     number | null;
    allowedDestinations?:   string[];
    restrictedDestinations?: string[];
    appliesToDepartments?:  string[];
}

export const travelPoliciesService = {
    async getAll(): Promise<TravelPolicy[]> {
        const { data } = await axios.get(`${BASE}/api/travel-policies`, { withCredentials: true });
        return data;
    },
    async getById(id: string): Promise<TravelPolicy> {
        const { data } = await axios.get(`${BASE}/api/travel-policies/${id}`, { withCredentials: true });
        return data;
    },
    async create(payload: TravelPolicyInput): Promise<TravelPolicy> {
        const { data } = await axios.post(`${BASE}/api/travel-policies`, payload, { withCredentials: true });
        return data;
    },
    async update(id: string, payload: Partial<TravelPolicyInput>): Promise<TravelPolicy> {
        const { data } = await axios.patch(`${BASE}/api/travel-policies/${id}`, payload, { withCredentials: true });
        return data;
    },
    async remove(id: string): Promise<void> {
        await axios.delete(`${BASE}/api/travel-policies/${id}`, { withCredentials: true });
    },
};
