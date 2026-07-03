import axios from "axios";
import { EventPhoto } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const eventPhotosService = {
    async getByEvent(eventId: string): Promise<EventPhoto[]> {
        const { data } = await axios.get(`${BASE}/api/event-photos/event/${eventId}`, { withCredentials: true });
        return data;
    },
    async upload(payload: { eventId: string; url: string; caption?: string }): Promise<EventPhoto> {
        const { data } = await axios.post(`${BASE}/api/event-photos`, payload, { withCredentials: true });
        return data;
    },
    async toggleLike(id: string): Promise<{ liked: boolean; count: number }> {
        const { data } = await axios.post(`${BASE}/api/event-photos/${id}/like`, {}, { withCredentials: true });
        return data;
    },
    async moderate(id: string, status: "APPROVED" | "REJECTED"): Promise<EventPhoto> {
        const { data } = await axios.patch(`${BASE}/api/event-photos/${id}/moderate`, { status }, { withCredentials: true });
        return data;
    },
    async remove(id: string): Promise<void> {
        await axios.delete(`${BASE}/api/event-photos/${id}`, { withCredentials: true });
    },
    async getPendingCount(): Promise<number> {
        const { data } = await axios.get(`${BASE}/api/event-photos/pending/count`, { withCredentials: true });
        return data.count;
    },
};
