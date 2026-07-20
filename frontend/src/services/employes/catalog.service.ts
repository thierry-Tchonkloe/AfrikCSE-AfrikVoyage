import api from "@/lib/api";
import { CatalogItem } from "@/types";

export interface CatalogFilters {
    category?:   string;
    search?:     string;
    sortBy?:     string;
    featured?:   boolean;
    city?:       string;
    region?:     string;
    offerType?:  string;
    subsidized?: boolean;
    lat?:        number;
    lng?:        number;
    radius?:     number;
}

export const catalogService = {
    async getAll(filters: CatalogFilters = {}): Promise<CatalogItem[]> {
        const { data } = await api.get("/catalog", { params: filters });
        return data;
    },

    async getFeatured(): Promise<CatalogItem[]> {
        const { data } = await api.get("/catalog/featured");
        return data;
    },

    async getCommitteeChoices(): Promise<CatalogItem[]> {
        const { data } = await api.get("/catalog/committee");
        return data;
    },

    async getNew(): Promise<CatalogItem[]> {
        const { data } = await api.get("/catalog/new");
        return data;
    },

    async getById(id: string): Promise<CatalogItem> {
        const { data } = await api.get(`/catalog/${id}`);
        return data;
    },

    async getCategories(): Promise<string[]> {
        const { data } = await api.get("/catalog/categories");
        return data;
    },

    // Admin endpoints
    async getAllAdmin(): Promise<CatalogItem[]> {
        const { data } = await api.get("/catalog/admin");
        return data;
    },

    async createItem(payload: Record<string, unknown>): Promise<CatalogItem> {
        const { data } = await api.post("/catalog", payload);
        return data;
    },

    async updateItem(id: string, payload: Record<string, unknown>): Promise<CatalogItem> {
        const { data } = await api.patch(`/catalog/${id}`, payload);
        return data;
    },

    async deleteItem(id: string): Promise<void> {
        await api.delete(`/catalog/${id}`);
    },

    async getAuditHistory(id: string): Promise<unknown[]> {
        const { data } = await api.get(`/catalog/${id}/audit`);
        return data;
    },
};
