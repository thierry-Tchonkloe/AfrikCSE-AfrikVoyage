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
    async approveTravel(id: string) {
        const { data } = await api.patch(`/travels/${id}/approve`);
        return data;
    },
    async rejectTravel(id: string, note: string) {
        const { data } = await api.patch(`/travels/${id}/reject`, { note });
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