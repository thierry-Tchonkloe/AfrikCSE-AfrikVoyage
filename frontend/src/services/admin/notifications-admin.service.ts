// import axios from "axios";
import api from "@/lib/api";
import { NotificationTemplate, NotificationLog, NotificationType, NotificationChannel } from "@/types";

// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";
// const URL  = `${BASE}/api/notifications/admin`;

export interface TemplateInput {
    channels?:     NotificationChannel[];
    emailSubject?: string | null;
    emailBody?:    string | null;
    smsBody?:      string | null;
    inAppTitle?:   string | null;
    inAppBody?:    string | null;
    isActive?:     boolean;
}

export const notificationsAdminService = {
    async listTemplates(): Promise<NotificationTemplate[]> {
        const { data } = await api.get(`/notifications/admin/templates`, { withCredentials: true });
        return data;
    },

    async upsertTemplate(event: NotificationType, payload: TemplateInput): Promise<NotificationTemplate> {
        const { data } = await api.put(`/notifications/admin/templates/${event}`, payload, { withCredentials: true });
        return data;
    },

    async deleteTemplate(event: NotificationType): Promise<void> {
        await api.delete(`/notifications/admin/templates/${event}`, { withCredentials: true });
    },

    async listLogs(page = 1, event?: NotificationType): Promise<{ logs: NotificationLog[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/notifications/admin/logs`, {
            params: { page, event },
            withCredentials: true,
        });
        return data;
    },
};
