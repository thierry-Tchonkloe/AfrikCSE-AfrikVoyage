import api from "@/lib/api";

export const voyageService = {
    async getTravels(params?: Record<string, unknown>) {
        const { data } = await api.get("/travels", { params });
        return data;
    },
    async getTravelStats() {
        const { data } = await api.get("/travels/stats");
        return data;
    },
    async getApprovalStats() {
        const { data } = await api.get("/travels/approvals/stats");
        return data;
    },
    async bulkApproveTravels(ids: string[]) {
        const { data } = await api.post("/travels/bulk-approve", { ids });
        return data;
    },
    async getTravelById(id: string) {
        const { data } = await api.get(`/travels/${id}`);
        return data;
    },
    async approveTravel(id: string) {
        const { data } = await api.patch(`/travels/${id}/approve`);
        return data;
    },
    async rejectTravel(id: string, note: string) {
        const { data } = await api.patch(`/travels/${id}/reject`, { note });
        return data;
    },
    async updateTravelStatus(id: string, status: string) {
        const { data } = await api.patch(`/travels/${id}/status`, { status });
        return data;
    },
    async assignPartner(id: string, partnerName: string) {
        const { data } = await api.patch(`/travels/${id}/partner`, { partnerName });
        return data;
    },
    async updatePayment(id: string, payload: { paymentStatus?: string; paymentLink?: string }) {
        const { data } = await api.patch(`/travels/${id}/payment`, payload);
        return data;
    },
    async getExpenses(params?: Record<string, unknown>) {
        const { data } = await api.get("/travels/expenses", { params });
        return data;
    },
    async getExpenseStats() {
        const { data } = await api.get("/travels/expenses/stats");
        return data;
    },
    async approveExpense(id: string) {
        const { data } = await api.patch(`/travels/expenses/${id}/approve`);
        return data;
    },
    async rejectExpense(id: string, note: string) {
        const { data } = await api.patch(`/travels/expenses/${id}/reject`, { note });
        return data;
    },
};