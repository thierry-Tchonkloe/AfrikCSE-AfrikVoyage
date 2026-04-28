import api from "@/lib/api";
import { AuthResponse } from "@/types";

export const authService = {
    async login(email: string, password: string): Promise<AuthResponse> {
        const { data } = await api.post("/auth/login", { email, password });
        return data;
    },

    async registerCompany(payload: Record<string, unknown>) {
        const { data } = await api.post("/auth/register-company", payload);
        return data;
    },

    async forgotPassword(email: string) {
        const { data } = await api.post("/auth/forgot-password", { email });
        return data;
    },

    async resetPassword(token: string, password: string) {
        const { data } = await api.post("/auth/reset-password", { token, password });
        return data;
    },

    async completeProfile(payload: Record<string, unknown>) {
        const { data } = await api.patch("/auth/complete-profile", payload);
        return data;
    },
};