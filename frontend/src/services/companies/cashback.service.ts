// import axios from "axios";
import { CashbackRule, CashbackTransaction, CashbackType } from "@/types";
import api from "@/lib/api";

// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface CashbackRuleInput {
    type:           CashbackType;
    rate:           number;
    fixedAmount?:   number;
    maxPerEmployee?: number;
    maxPerPeriod?:  number;
    startDate?:     string;
    endDate?:       string;
    category?:      string;
    partnerId?:     string;
    currencyCode?:  string;
}

export const cashbackAdminService = {
    async listRules(): Promise<CashbackRule[]> {
        const { data } = await api.get(`/cashback/rules`, { withCredentials: true });
        return data;
    },

    async createRule(payload: CashbackRuleInput): Promise<CashbackRule> {
        const { data } = await api.post(`/cashback/rules`, payload, { withCredentials: true });
        return data;
    },

    async updateRule(id: string, payload: Partial<CashbackRuleInput> & { isActive?: boolean }): Promise<CashbackRule> {
        const { data } = await api.patch(`/cashback/rules/${id}`, payload, { withCredentials: true });
        return data;
    },

    async deleteRule(id: string): Promise<void> {
        await api.delete(`/cashback/rules/${id}`, { withCredentials: true });
    },

    async listTransactions(page = 1, limit = 20): Promise<{ transactions: CashbackTransaction[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/cashback/transactions`, {
            params: { page, limit },
            withCredentials: true,
        });
        return data;
    },
};
