import api from "@/lib/api";
import { GroupTravel } from "@/types";

function cfg() {
    return { withCredentials: true };
}

export interface GroupTravelInput {
    title:           string;
    description?:    string;
    destination:     string;
    departureDate:   string;
    returnDate:      string;
    estimatedCost?:  number | null;
    maxParticipants?: number | null;
    currency?:       string;
    notes?:          string;
}

export const groupTravelService = {
    async getAll(): Promise<GroupTravel[]> {
        const { data } = await api.get(`/group-travel`, cfg());
        return data;
    },
    async getById(id: string): Promise<GroupTravel> {
        const { data } = await api.get(`/group-travel/${id}`, cfg());
        return data;
    },
    async create(payload: GroupTravelInput): Promise<GroupTravel> {
        const { data } = await api.post(`/group-travel`, payload, cfg());
        return data;
    },
    async update(id: string, payload: Partial<GroupTravelInput>): Promise<GroupTravel> {
        const { data } = await api.patch(`/group-travel/${id}`, payload, cfg());
        return data;
    },
    async updateStatus(id: string, status: string): Promise<GroupTravel> {
        const { data } = await api.patch(`/group-travel/${id}/status`, { status }, cfg());
        return data;
    },
    async remove(id: string): Promise<void> {
        await api.delete(`/group-travel/${id}`, cfg());
    },
    async invite(id: string, userId: string): Promise<void> {
        await api.post(`/group-travel/${id}/invite`, { userId }, cfg());
    },
    async respond(id: string, accept: boolean, note?: string): Promise<void> {
        await api.post(`/group-travel/${id}/respond`, { accept, note }, cfg());
    },
};
