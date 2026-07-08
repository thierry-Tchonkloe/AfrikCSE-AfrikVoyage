import api from "@/lib/api";
import { FamilyMember } from "@/types";

function cfg() {
    return { withCredentials: true };
}

export interface FamilyMemberInput {
    firstName:    string;
    lastName:     string;
    relationship: FamilyMember["relationship"];
    birthDate?:   string;
    documentUrl?: string;
}

export const familyService = {
    async getAll(): Promise<FamilyMember[]> {
        const { data } = await api.get(`/family-members`, cfg());
        return data;
    },

    async getById(id: string): Promise<FamilyMember> {
        const { data } = await api.get(`/family-members/${id}`, cfg());
        return data;
    },

    async create(payload: FamilyMemberInput): Promise<FamilyMember> {
        const { data } = await api.post(`/family-members`, payload, cfg());
        return data;
    },

    async update(id: string, payload: Partial<FamilyMemberInput>): Promise<FamilyMember> {
        const { data } = await api.patch(`/family-members/${id}`, payload, cfg());
        return data;
    },

    async remove(id: string): Promise<void> {
        await api.delete(`/family-members/${id}`, cfg());
    },
};
