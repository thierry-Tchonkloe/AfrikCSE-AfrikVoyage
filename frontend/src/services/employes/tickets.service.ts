import axios from "axios";
import { Ticket } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const ticketsService = {
    async generate(offerId: string, familyMemberId?: string): Promise<Ticket> {
        const { data } = await axios.post(
            `${BASE}/api/tickets/generate`,
            { offerId, familyMemberId },
            { withCredentials: true }
        );
        return data;
    },

    async getMyTickets(): Promise<Ticket[]> {
        const { data } = await axios.get(`${BASE}/api/tickets`, { withCredentials: true });
        return data;
    },

    async getByCode(code: string): Promise<Ticket> {
        const { data } = await axios.get(`${BASE}/api/tickets/${code}`, { withCredentials: true });
        return data;
    },

    async cancel(id: string): Promise<Ticket> {
        const { data } = await axios.delete(`${BASE}/api/tickets/${id}`, { withCredentials: true });
        return data;
    },
};
