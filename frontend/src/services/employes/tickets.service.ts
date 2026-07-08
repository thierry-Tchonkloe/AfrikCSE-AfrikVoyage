import api from "@/lib/api";
import { Ticket } from "@/types";

function cfg() {
    return { withCredentials: true };
}

export const ticketsService = {
    async generate(offerId: string, familyMemberId?: string): Promise<Ticket> {
        const { data } = await api.post(
            `/tickets/generate`,
            { offerId, familyMemberId },
            cfg()
        );
        return data;
    },

    async getMyTickets(): Promise<Ticket[]> {
        const { data } = await api.get(`/tickets`, cfg());
        return data;
    },

    async getByCode(code: string): Promise<Ticket> {
        const { data } = await api.get(`/tickets/${code}`, cfg());
        return data;
    },

    async cancel(id: string): Promise<Ticket> {
        const { data } = await api.delete(`/tickets/${id}`, cfg());
        return data;
    },
};
