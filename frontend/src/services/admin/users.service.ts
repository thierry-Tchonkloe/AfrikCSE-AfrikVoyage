import api from "@/lib/api";

export interface HostUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

export interface CreateHostUserPayload {
    email: string;
    firstName: string;
    lastName: string;
    role: "MANAGER";
}

export const usersService = {
    async getHostUsers(): Promise<HostUser[]> {
        const { data } = await api.get("/users/host");
        return data;
    },

    async create(payload: CreateHostUserPayload) {
        const { data } = await api.post("/users", payload);
        return data;
    },

    async changeRole(id: string, role: string) {
        const { data } = await api.patch(`/users/${id}/role`, { role });
        return data;
    },

    async activate(id: string) {
        const { data } = await api.patch(`/users/${id}/activate`);
        return data;
    },

    async deactivate(id: string) {
        const { data } = await api.patch(`/users/${id}/deactivate`);
        return data;
    },
};
