import api from "@/lib/api";

export type SearchScope = "employee" | "company" | "admin";

export interface SearchResultItem {
    id: string;
    type: "travel" | "expense" | "benefit" | "event" | "employee" | "organization";
    title: string;
    subtitle?: string;
    url: string;
}

export const searchService = {
    /** Recherche globale transverse, filtrée par scope (employee, company, admin) */
    async search(q: string, scope: SearchScope): Promise<SearchResultItem[]> {
        if (q.trim().length < 2) return [];
        const { data } = await api.get("/search", { params: { q, scope } });
        return data.results;
    },
};
