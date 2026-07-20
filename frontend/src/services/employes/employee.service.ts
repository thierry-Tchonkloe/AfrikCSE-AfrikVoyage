import api from "@/lib/api";

export const employeeService = {
    // ── Dashboard ─────────────────────────────────────────────────────────────
    async getDashboard() {
        const { data } = await api.get("/employee/dashboard");
        return data;
    },

    // ── Voyages ───────────────────────────────────────────────────────────────
    async getMyTravels() {
        const { data } = await api.get("/employee/travels");
        return data;
    },
    async createTravel(payload: Record<string, unknown>) {
        const { data } = await api.post("/employee/travels", payload);
        return data;
    },

    // ── Notes de frais ────────────────────────────────────────────────────────
    async getMyExpenses() {
        const { data } = await api.get("/employee/expenses");
        return data;
    },
    async createExpense(payload: Record<string, unknown>) {
        const { data } = await api.post("/employee/expenses", payload);
        return data;
    },
    async uploadReceipt(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        // L'instance axios fixe "Content-Type: application/json" par défaut,
        // ce qui ferait JSON-stringifier le FormData (le File devient {}).
        // On efface l'en-tête ici pour que le navigateur génère lui-même
        // le "multipart/form-data; boundary=..." correct.
        const { data } = await api.post("/employee/expenses/upload", formData, {
            headers: { "Content-Type": undefined },
        });
        return data as { url: string; name: string; size: string };
    },

    // ── Avantages CSE ─────────────────────────────────────────────────────────
    async getBenefitCategories() {
        const { data } = await api.get("/employee/benefits/categories");
        return data;
    },
    async getBenefitBalance() {
        const { data } = await api.get("/employee/benefits/balance");
        return data;
    },
    async getMyBenefitRequests() {
        const { data } = await api.get("/employee/benefits/requests");
        return data;
    },
    async submitBenefitRequest(payload: {
        categoryId: string;
        amount: number;
        description?: string;
        urgency?: "LOW" | "MEDIUM" | "HIGH";
        receipts?: string[];
    }) {
        const { data } = await api.post("/employee/benefits/requests", payload);
        return data;
    },
    async cancelBenefitRequest(id: string) {
        const { data } = await api.patch(`/employee/benefits/requests/${id}/cancel`);
        return data;
    },

    // ── Profil ────────────────────────────────────────────────────────────────
    async getProfile() {
        const { data } = await api.get("/employee/profile");
        return data;
    },
    async updateProfile(payload: Record<string, unknown>) {
        const { data } = await api.patch("/employee/profile", payload);
        return data;
    },
    async uploadAvatar(file: File) {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/employee/avatar", formData, {
            headers: { "Content-Type": undefined },
        });
        return data as { avatar: string };
    },
    async getActivityLog(page = 1, limit = 10) {
        const { data } = await api.get("/employee/activity-log", { params: { page, limit } });
        return data;
    },

    // ── Documents ─────────────────────────────────────────────────────────────
    async getDocuments() {
        const { data } = await api.get("/employee/documents");
        return data;
    },
    async addDocument(payload: { name: string; url: string; type: string; size?: string }) {
        const { data } = await api.post("/employee/documents", payload);
        return data;
    },
    async deleteDocument(id: string) {
        const { data } = await api.delete(`/employee/documents/${id}`);
        return data;
    },

    // ── Catalogue avantages (public) ──────────────────────────────────────────
    async getCatalog(params?: Record<string, string>) {
        const { data } = await api.get("/catalog", { params });
        return data;
    },
    async getCatalogItem(id: string) {
        const { data } = await api.get(`/catalog/${id}`);
        return data;
    },
    async getCatalogCategories() {
        const { data } = await api.get("/catalog/categories");
        return data;
    },

    // ── Événements ────────────────────────────────────────────────────────────
    async getEvents(month?: number, year?: number) {
        const { data } = await api.get("/events", {
            params: month !== undefined ? { month, year } : {},
        });
        return data;
    },
    async getUpcomingEvents() {
        const { data } = await api.get("/events/upcoming");
        return data;
    },
    async getRecentEvents() {
        const { data } = await api.get("/events/recent");
        return data;
    },
    async getEventStats() {
        const { data } = await api.get("/events/stats");
        return data;
    },
    async registerEvent(id: string) {
        const { data } = await api.post(`/events/${id}/register`);
        return data;
    },
    async unregisterEvent(id: string) {
        const { data } = await api.delete(`/events/${id}/register`);
        return data;
    },
    async createEvent(payload: Record<string, unknown>) {
        const { data } = await api.post("/events", payload);
        return data;
    },

    // ── Communication ─────────────────────────────────────────────────────────
    async getPosts(page = 1) {
        const { data } = await api.get("/communication/posts", { params: { page } });
        return data;
    },
    async createPost(payload: Record<string, unknown>) {
        const { data } = await api.post("/communication/posts", payload);
        return data;
    },
    async toggleLike(postId: string) {
        const { data } = await api.post(`/communication/posts/${postId}/like`);
        return data;
    },
    async vote(optionId: string) {
        const { data } = await api.post(`/communication/poll-options/${optionId}/vote`);
        return data;
    },
    async addComment(postId: string, content: string) {
        const { data } = await api.post(`/communication/posts/${postId}/comment`, { content });
        return data;
    },
    async getComments(postId: string) {
        const { data } = await api.get(`/communication/posts/${postId}/comments`);
        return data;
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    async getNotifications(page = 1) {
        const { data } = await api.get("/notifications", { params: { page } });
        return data;
    },
    async getUnreadNotificationCount() {
        const { data } = await api.get("/notifications/unread-count");
        return data as { count: number };
    },
    async markNotificationAsRead(id: string) {
        const { data } = await api.patch(`/notifications/${id}/read`);
        return data;
    },
    async markAllNotificationsAsRead() {
        const { data } = await api.patch("/notifications/read-all");
        return data;
    },

    // ── Messagerie / Support ──────────────────────────────────────────────────
    async getSupportConversation() {
        const { data } = await api.get("/messaging/conversations/support");
        return data;
    },
    async getConversationMessages(conversationId: string, page = 1) {
        const { data } = await api.get(`/messaging/conversations/${conversationId}/messages`, {
            params: { page },
        });
        return data;
    },
    async sendConversationMessage(conversationId: string, content: string) {
        const { data } = await api.post(`/messaging/conversations/${conversationId}/messages`, { content });
        return data;
    },
    async markConversationAsRead(conversationId: string) {
        const { data } = await api.patch(`/messaging/conversations/${conversationId}/read`);
        return data;
    },

    // ── Économies ─────────────────────────────────────────────────────────────
    async getMySavings() {
        const { data } = await api.get("/employee/savings");
        return data;
    },

    // ── Carte de membre ────────────────────────────────────────────────────────
    async getMemberCard() {
        const { data } = await api.get("/employee/member-card");
        return data;
    },

};
