import api from "@/lib/api";

export interface SubsidyRule {
    id:             string;
    label:          string;
    category:       string | null;
    offerType:      string | null;
    subsidyPct:     number | null;
    subsidyAmount:  string | null;
    currencyCode:   string;
    maxPerEmployee: string | null;
    startsAt:       string | null;
    endsAt:         string | null;
    isActive:       boolean;
    priority:       number;
    createdAt:      string;
}

export interface SubsidyRuleInput {
    label:          string;
    category?:      string;
    offerType?:     string;
    subsidyPct?:    number;
    subsidyAmount?: number;
    currencyCode?:  string;
    maxPerEmployee?: number;
    startsAt?:      string;
    endsAt?:        string;
    isActive?:      boolean;
    priority?:      number;
}

export const subsidyRulesService = {
    async getAll(): Promise<SubsidyRule[]> {
        const { data } = await api.get("/subsidy-rules");
        return data;
    },

    async create(payload: SubsidyRuleInput): Promise<SubsidyRule> {
        const { data } = await api.post("/subsidy-rules", payload);
        return data;
    },

    async update(id: string, payload: Partial<SubsidyRuleInput>): Promise<SubsidyRule> {
        const { data } = await api.put(`/subsidy-rules/${id}`, payload);
        return data;
    },

    async remove(id: string): Promise<void> {
        await api.delete(`/subsidy-rules/${id}`);
    },
};
