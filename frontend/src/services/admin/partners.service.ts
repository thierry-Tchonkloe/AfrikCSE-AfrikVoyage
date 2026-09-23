import api from "@/lib/api";
import { Partner, PartnerSyncLog, CatalogItem } from "@/types";

export interface PartnerFilters {
    status?:    string;
    scopeType?: string;
    search?:    string;
    page?:      number;
    limit?:     number;
}

export interface PartnerListResponse {
    data:  Partner[];
    total: number;
    page:  number;
    limit: number;
}

export const partnersService = {
    async getAll(filters: PartnerFilters = {}): Promise<PartnerListResponse> {
        const { data } = await api.get("/partners", { params: filters });
        return data;
    },

    async getById(id: string): Promise<Partner> {
        const { data } = await api.get(`/partners/${id}`);
        return data;
    },

    async create(payload: Record<string, unknown>): Promise<Partner & { activationLink?: string }> {
        const { data } = await api.post("/partners", payload);
        return data;
    },

    async update(id: string, payload: Record<string, unknown>): Promise<Partner> {
        const { data } = await api.patch(`/partners/${id}`, payload);
        return data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/partners/${id}`);
    },

    async sync(id: string): Promise<{ message: string; log: PartnerSyncLog }> {
        const { data } = await api.post(`/partners/${id}/sync`);
        return data;
    },

    async getSyncLogs(id: string): Promise<PartnerSyncLog[]> {
        const { data } = await api.get(`/partners/${id}/logs`);
        return data;
    },

    async getPendingOffers(): Promise<CatalogItem[]> {
        const { data } = await api.get("/partners/offers/pending");
        return data;
    },

    async approveOffer(offerId: string): Promise<{ message: string; offer: CatalogItem }> {
        const { data } = await api.patch(`/partners/offers/${offerId}/approve`);
        return data;
    },

    async rejectOffer(offerId: string, note: string): Promise<{ message: string; offer: CatalogItem }> {
        const { data } = await api.patch(`/partners/offers/${offerId}/reject`, { note });
        return data;
    },
};
