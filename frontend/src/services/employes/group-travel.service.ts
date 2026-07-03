import axios from "axios";
import { GroupTravel } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

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
        const { data } = await axios.get(`${BASE}/api/group-travel`, { withCredentials: true });
        return data;
    },
    async getById(id: string): Promise<GroupTravel> {
        const { data } = await axios.get(`${BASE}/api/group-travel/${id}`, { withCredentials: true });
        return data;
    },
    async create(payload: GroupTravelInput): Promise<GroupTravel> {
        const { data } = await axios.post(`${BASE}/api/group-travel`, payload, { withCredentials: true });
        return data;
    },
    async update(id: string, payload: Partial<GroupTravelInput>): Promise<GroupTravel> {
        const { data } = await axios.patch(`${BASE}/api/group-travel/${id}`, payload, { withCredentials: true });
        return data;
    },
    async updateStatus(id: string, status: string): Promise<GroupTravel> {
        const { data } = await axios.patch(`${BASE}/api/group-travel/${id}/status`, { status }, { withCredentials: true });
        return data;
    },
    async remove(id: string): Promise<void> {
        await axios.delete(`${BASE}/api/group-travel/${id}`, { withCredentials: true });
    },
    async invite(id: string, userId: string): Promise<void> {
        await axios.post(`${BASE}/api/group-travel/${id}/invite`, { userId }, { withCredentials: true });
    },
    async respond(id: string, accept: boolean, note?: string): Promise<void> {
        await axios.post(`${BASE}/api/group-travel/${id}/respond`, { accept, note }, { withCredentials: true });
    },
};
