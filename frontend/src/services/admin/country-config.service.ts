//import axios from "axios";
import api from "@/lib/api";

//const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
//const URL  = `${BASE}/api/countries`;

function cfg() {
    return { withCredentials: true };
}

export interface CountryConfig {
    id: string;
    code: string;
    name: string;
    currencyCode: string;
    locale: string;
    taxRate: string;
    phonePrefix: string | null;
    isActive: boolean;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface CountryConfigInput {
    code: string;
    name: string;
    currencyCode?: string;
    locale?: string;
    taxRate?: number;
    phonePrefix?: string;
    isActive?: boolean;
    metadata?: Record<string, unknown>;
}

export const countryConfigService = {
    async list(): Promise<CountryConfig[]> {
        const r = await api.get("/countries", cfg());
        return r.data;
    },
    async findByCode(code: string): Promise<CountryConfig> {
        const r = await api.get(`/countries/${code}`, cfg());
        return r.data;
    },
    async upsert(body: CountryConfigInput): Promise<CountryConfig> {
        const r = await api.put(`/countries/${body.code}`, body, cfg());
        return r.data;
    },
    async remove(code: string): Promise<void> {
        await api.delete(`/countries/${code}`, cfg());
    },
};
