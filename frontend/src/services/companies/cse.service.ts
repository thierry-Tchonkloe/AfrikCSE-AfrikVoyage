import api from "@/lib/api";

export const cseService = {
    // ── Employés ──
    async getEmployees(params?: Record<string, unknown>) {
        const { data } = await api.get("/employees", { params });
        return data;
    },
    async getEmployeeStats() {
        const { data } = await api.get("/employees/stats");
        return data;
    },

    // ── Subventions ──
    async getCategories() {
        const { data } = await api.get("/benefits/categories");
        return data;
    },
    async createCategory(payload: Record<string, unknown>) {
        const { data } = await api.post("/benefits/categories", payload);
        return data;
    },
    async updateCategory(id: string, payload: Record<string, unknown>) {
        const { data } = await api.patch(`/benefits/categories/${id}`, payload);
        return data;
    },
    async deleteCategory(id: string) {
        const { data } = await api.delete(`/benefits/categories/${id}`);
        return data;
    },

    // ── Approbations ──
    async getRequests(params?: Record<string, unknown>) {
        const { data } = await api.get("/benefits/requests", { params });
        return data;
    },
    async getApprovalStats() {
        const { data } = await api.get("/benefits/requests/stats");
        return data;
    },
    async approveRequest(id: string) {
        const { data } = await api.patch(`/benefits/requests/${id}/approve`);
        return data;
    },
    async rejectRequest(id: string, note: string) {
        const { data } = await api.patch(`/benefits/requests/${id}/reject`, { note });
        return data;
    },
    async bulkApprove(ids: string[]) {
        const { data } = await api.post("/benefits/requests/bulk-approve", { ids });
        return data;
    },

    // ── Rapports ──
    async getBudgetReport(params?: { year?: number; department?: string; startDate?: string; endDate?: string }) {
        const { data } = await api.get("/benefits/report", { params });
        return data;
    },
    async getComplianceReport() {
        const { data } = await api.get("/benefits/compliance");
        return data;
    },

    // ── Messagerie ──
    async getConversations(params?: { page?: number; limit?: number; search?: string; status?: string }) {
        const { data } = await api.get("/messaging/conversations", { params });
        return data;
    },
    async getMessages(conversationId: string, page = 1) {
        const { data } = await api.get(`/messaging/conversations/${conversationId}/messages`, {
        params: { page },
        });
        return data;
    },
    async sendMessage(conversationId: string, content: string) {
        const { data } = await api.post(
        `/messaging/conversations/${conversationId}/messages`,
        { content }
        );
        return data;
    },
    async createConversation(participantIds: string[]) {
        const { data } = await api.post("/messaging/conversations", { participantIds });
        return data;
    },

    // Ajoute ces méthodes au cseService existant

    async getSupportConversation() {
        const { data } = await api.get("/messaging/conversations/support");
        return data;
    },

    async getUnreadCount() {
        const { data } = await api.get("/messaging/conversations/unread");
        return data;
    },

    async markAsRead(conversationId: string) {
        const { data } = await api.patch(`/messaging/conversations/${conversationId}/read`);
        return data;
    },

    async updateConversationStatus(conversationId: string, status: "OPEN" | "RESOLVED") {
        const { data } = await api.patch(`/messaging/conversations/${conversationId}/status`, { status });
        return data;
    },
};