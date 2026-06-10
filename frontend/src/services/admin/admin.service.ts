import api from "@/lib/api";

export const adminService = {
    // ── Dashboard ──
    async getDashboard() {
        const { data } = await api.get("/settings/dashboard");
        return data;
    },

    // ── Settings ──
    async getSettings() {
        const { data } = await api.get("/settings");
        return data;
    },

    async updateSettings(payload: Record<string, unknown>) {
        const { data } = await api.patch("/settings", payload);
        return data;
    },

    // ── Organisations ──
    async getOrganizations(params: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        module?: string;
    }) {
        const { data } = await api.get("/organizations/paginated", { params });
        return data;
    },

    async getOrganization(id: string) {
        const { data } = await api.get(`/organizations/${id}`);
        return data;
    },

    async createOrganization(payload: Record<string, unknown>) {
        const { data } = await api.post("/organizations", payload);
        return data;
    },

    async validateOrganization(
        id: string,
        payload: { hasVoyage: boolean; hasCSE: boolean }
    ) {
        const { data } = await api.patch(
        `/organizations/${id}/validate-invite`,
        payload
        );
        return data;
    },

    async rejectOrganization(id: string, rejectionNote: string) {
        const { data } = await api.patch(`/organizations/${id}/reject`, {
        rejectionNote,
        });
        return data;
    },

    async updateModules(
        id: string,
        payload: { hasVoyage: boolean; hasCSE: boolean }
    ) {
        const { data } = await api.patch(`/organizations/${id}/modules`, payload);
        return data;
    },

    async suspendOrganization(id: string) {
        const { data } = await api.patch(`/organizations/${id}/suspend`);
        return data;
    },

    async deleteOrganization(id: string) {
        const { data } = await api.delete(`/organizations/${id}`);
        return data;
    },

    // ── Validations (organisations PENDING) ──
    async getPendingOrganizations() {
        const { data } = await api.get("/organizations/paginated", {
        params: { status: "PENDING", limit: 50 },
        });
        return data;
    },




    async updateOrganization(id: string, payload: Record<string, unknown>) {
        const { data } = await api.patch(`/organizations/${id}`, payload);
        return data;
    },

    async reactivateOrganization(id: string) {
        const { data } = await api.patch(`/organizations/${id}/reactivate`);
        return data;
    },

    async regenerateInvitation(id: string) {
        const { data } = await api.post(`/organizations/${id}/invite`);
        return data;
    },
};