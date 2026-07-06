// import axios from "axios";
import { CommissionRule, CommissionEntry, PartnerPayout, CommissionType } from "@/types";
import api from "@/lib/api";

// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface CommissionRuleInput {
    partnerId?:   string;
    category?:    string;
    type:         CommissionType;
    rate:         number;
    fixedAmount?: number;
    currencyCode?: string;
}

export const commissionsService = {
    async listRules(partnerId?: string): Promise<CommissionRule[]> {
        const { data } = await api.get(`/commissions/rules`, {
            params: partnerId ? { partnerId } : {},
            withCredentials: true,
        });
        return data;
    },

    async createRule(payload: CommissionRuleInput): Promise<CommissionRule> {
        const { data } = await api.post(`/commissions/rules`, payload, { withCredentials: true });
        return data;
    },

    async updateRule(id: string, payload: Partial<CommissionRuleInput> & { isActive?: boolean }): Promise<CommissionRule> {
        const { data } = await api.patch(`/commissions/rules/${id}`, payload, { withCredentials: true });
        return data;
    },

    async deleteRule(id: string): Promise<void> {
        await api.delete(`/commissions/rules/${id}`, { withCredentials: true });
    },

    async listEntries(partnerId?: string, page = 1, limit = 50): Promise<{ entries: CommissionEntry[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/commissions/entries`, {
            params: { partnerId, page, limit },
            withCredentials: true,
        });
        return data;
    },

    async listPayouts(partnerId?: string, page = 1, limit = 20): Promise<{ payouts: PartnerPayout[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/commissions/payouts`, {
            params: { partnerId, page, limit },
            withCredentials: true,
        });
        return data;
    },

    async triggerPayout(partnerId: string, period: string): Promise<PartnerPayout> {
        const { data } = await api.post(`/commissions/payouts`, { partnerId, period }, { withCredentials: true });
        return data;
    },

    async markPayoutPaid(id: string): Promise<PartnerPayout> {
        const { data } = await api.patch(`/commissions/payouts/${id}/paid`, {}, { withCredentials: true });
        return data;
    },
};
