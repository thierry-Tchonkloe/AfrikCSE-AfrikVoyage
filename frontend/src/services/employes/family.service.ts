import axios from "axios";
import { FamilyMember } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface FamilyMemberInput {
    firstName:    string;
    lastName:     string;
    relationship: FamilyMember["relationship"];
    birthDate?:   string;
    documentUrl?: string;
}

export const familyService = {
    async getAll(): Promise<FamilyMember[]> {
        const { data } = await axios.get(`${BASE}/api/family-members`, { withCredentials: true });
        return data;
    },

    async getById(id: string): Promise<FamilyMember> {
        const { data } = await axios.get(`${BASE}/api/family-members/${id}`, { withCredentials: true });
        return data;
    },

    async create(payload: FamilyMemberInput): Promise<FamilyMember> {
        const { data } = await axios.post(`${BASE}/api/family-members`, payload, { withCredentials: true });
        return data;
    },

    async update(id: string, payload: Partial<FamilyMemberInput>): Promise<FamilyMember> {
        const { data } = await axios.patch(`${BASE}/api/family-members/${id}`, payload, { withCredentials: true });
        return data;
    },

    async remove(id: string): Promise<void> {
        await axios.delete(`${BASE}/api/family-members/${id}`, { withCredentials: true });
    },
};
