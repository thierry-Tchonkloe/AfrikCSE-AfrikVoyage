import axios from "axios";
import { FaqEntry } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface FaqInput {
    question:  string;
    answer:    string;
    category?: string;
    order?:    number;
    status?:   "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export const faqService = {
    async getPublished(category?: string): Promise<FaqEntry[]> {
        const params = category ? `?category=${encodeURIComponent(category)}` : "";
        const { data } = await axios.get(`${BASE}/api/faq${params}`, { withCredentials: true });
        return data;
    },
    async getCategories(): Promise<string[]> {
        const { data } = await axios.get(`${BASE}/api/faq/categories`, { withCredentials: true });
        return data;
    },
    async vote(id: string, helpful: boolean): Promise<void> {
        await axios.post(`${BASE}/api/faq/${id}/vote`, { helpful }, { withCredentials: true });
    },
    // Admin
    async getAll(): Promise<FaqEntry[]> {
        const { data } = await axios.get(`${BASE}/api/faq/admin`, { withCredentials: true });
        return data;
    },
    async create(payload: FaqInput): Promise<FaqEntry> {
        const { data } = await axios.post(`${BASE}/api/faq`, payload, { withCredentials: true });
        return data;
    },
    async update(id: string, payload: Partial<FaqInput>): Promise<FaqEntry> {
        const { data } = await axios.patch(`${BASE}/api/faq/${id}`, payload, { withCredentials: true });
        return data;
    },
    async remove(id: string): Promise<void> {
        await axios.delete(`${BASE}/api/faq/${id}`, { withCredentials: true });
    },
};
