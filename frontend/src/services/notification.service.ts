import api from "@/lib/api";
import { Notification, NotificationType } from "@/types";

export const notificationService = {
    /** Liste paginée des notifications de l'utilisateur connecté, filtrable par type */
    async getNotifications(page = 1, type?: NotificationType) {
        const { data } = await api.get("/notifications", { params: { page, type } });
        return data as { notifications: Notification[]; total: number; page: number; totalPages: number };
    },

    async getUnreadCount() {
        const { data } = await api.get("/notifications/unread-count");
        return data as { count: number };
    },

    async markAsRead(id: string) {
        const { data } = await api.patch(`/notifications/${id}/read`);
        return data;
    },

    async markAllAsRead() {
        const { data } = await api.patch("/notifications/read-all");
        return data;
    },
};
