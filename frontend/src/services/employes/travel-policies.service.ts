import api from "@/lib/api";
import { TravelPolicy } from "@/types";

function cfg() {
    return { withCredentials: true };
}

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
        const { data } = await api.get(`/travel-policies`, cfg());
        return data;
    },
    async getById(id: string): Promise<TravelPolicy> {
        const { data } = await api.get(`/travel-policies/${id}`, cfg());
        return data;
    },
    async create(payload: TravelPolicyInput): Promise<TravelPolicy> {
        const { data } = await api.post(`/travel-policies`, payload, cfg());
        return data;
    },
    async update(id: string, payload: Partial<TravelPolicyInput>): Promise<TravelPolicy> {
        const { data } = await api.patch(`/travel-policies/${id}`, payload, cfg());
        return data;
    },
    async remove(id: string): Promise<void> {
        await api.delete(`/travel-policies/${id}`, cfg());
    },
};
