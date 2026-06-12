import api from "@/lib/api";

export const companyService = {
    // Dashboard de l'organisation connectée
    async getDashboard() {
        const { data } = await api.get("/organizations/my/dashboard");
        return data;
    },

    // Mettre à jour les infos de sa propre organisation (ADMIN/MANAGER uniquement)
    async updateMyOrg(payload: Record<string, unknown>) {
        const { data } = await api.patch("/organizations/my", payload);
        return data;
    },

    // Users de l'organisation
    async getUsers() {
        const { data } = await api.get("/users");
        return data;
    },

    async createUser(payload: Record<string, unknown>) {
        const { data } = await api.post("/users", payload);
        return data;
    },

    async updateUser(id: string, payload: Record<string, unknown>) {
        const { data } = await api.patch(`/users/${id}`, payload);
        return data;
    },

    async changeUserRole(id: string, role: string) {
        const { data } = await api.patch(`/users/${id}/role`, { role });
        return data;
    },

    async deactivateUser(id: string) {
        const { data } = await api.patch(`/users/${id}/deactivate`);
        return data;
    },

    async activateUser(id: string) {
        const { data } = await api.patch(`/users/${id}/activate`);
        return data;
    },
};