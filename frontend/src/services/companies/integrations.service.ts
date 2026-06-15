import api from "@/lib/api";

export const integrationService = {
    async getAll() {
        const { data } = await api.get("/integrations");
        return data;
    },
    async getById(id: string) {
        const { data } = await api.get(`/integrations/${id}`);
        return data;
    },
    async create(payload: Record<string, unknown>) {
        const { data } = await api.post("/integrations", payload);
        return data;
    },
    async update(id: string, payload: Record<string, unknown>) {
        const { data } = await api.patch(`/integrations/${id}`, payload);
        return data;
    },
    async delete(id: string) {
        const { data } = await api.delete(`/integrations/${id}`);
        return data;
    },
    async getSyncLogs(id: string) {
        const { data } = await api.get(`/integrations/${id}/logs`);
        return data;
    },
    async testConnection(id: string) {
        const { data } = await api.post(`/integrations/${id}/test`);
        return data;
    },
    async sync(id: string, type: "AUTOMATIC" | "MANUAL" = "MANUAL") {
        const { data } = await api.post(`/integrations/${id}/sync`, { type });
        return data;
    },
};
