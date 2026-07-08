import api from "@/lib/api";
import { EventPhoto } from "@/types";

function cfg() {
    return { withCredentials: true };
}

export const eventPhotosService = {
    async getByEvent(eventId: string): Promise<EventPhoto[]> {
        const { data } = await api.get(`/event-photos/event/${eventId}`, cfg());
        return data;
    },
    async upload(payload: { eventId: string; url: string; caption?: string }): Promise<EventPhoto> {
        const { data } = await api.post(`/event-photos`, payload, cfg());
        return data;
    },
    async toggleLike(id: string): Promise<{ liked: boolean; count: number }> {
        const { data } = await api.post(`/event-photos/${id}/like`, {}, cfg());
        return data;
    },
    async moderate(id: string, status: "APPROVED" | "REJECTED"): Promise<EventPhoto> {
        const { data } = await api.patch(`/event-photos/${id}/moderate`, { status }, cfg());
        return data;
    },
    async remove(id: string): Promise<void> {
        await api.delete(`/event-photos/${id}`, cfg());
    },
    async getPendingCount(): Promise<number> {
        const { data } = await api.get(`/event-photos/pending/count`, cfg());
        return data.count;
    },
};
