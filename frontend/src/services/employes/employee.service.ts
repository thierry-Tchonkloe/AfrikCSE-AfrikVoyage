import api from "@/lib/api";

export const employeeService = {
    // Dashboard
    async getDashboard() {
        const { data } = await api.get("/employee/dashboard");
        return data;
    },

    // Voyages
    async getMyTravels() {
        const { data } = await api.get("/employee/travels");
        return data;
    },
    async createTravel(payload: Record<string, unknown>) {
        const { data } = await api.post("/employee/travels", payload);
        return data;
    },

    // Notes de frais
    async getMyExpenses() {
        const { data } = await api.get("/employee/expenses");
        return data;
    },
    async createExpense(payload: Record<string, unknown>) {
        const { data } = await api.post("/employee/expenses", payload);
        return data;
    },

    // Profil
    async getProfile() {
        const { data } = await api.get("/employee/profile");
        return data;
    },
    async updateProfile(payload: Record<string, unknown>) {
        const { data } = await api.patch("/employee/profile", payload);
        return data;
    },

    // Documents
    async getDocuments() {
        const { data } = await api.get("/employee/documents");
        return data;
    },
    async deleteDocument(id: string) {
        const { data } = await api.delete(`/employee/documents/${id}`);
        return data;
    },

    // Avantages catalogue
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

    // Événements
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

    // Communication
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
};