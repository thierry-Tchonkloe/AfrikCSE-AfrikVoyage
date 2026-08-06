import api from "@/lib/api";
import { AuthResponse } from "@/types";

export type UserSession = {
    id: string;
    userAgent: string | null;
    ipAddress: string | null;
    createdAt: string;
    lastUsedAt: string;
    expiresAt: string;
    isCurrent: boolean;
};

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

    // ── Sessions (appareils connectés) ───────────────────────────────────
    async getSessions(): Promise<{ sessions: UserSession[] }> {
        const { data } = await api.get("/auth/sessions");
        return data;
    },

    async revokeSession(id: string) {
        const { data } = await api.delete(`/auth/sessions/${id}`);
        return data;
    },

    async revokeOtherSessions() {
        const { data } = await api.delete("/auth/sessions/others");
        return data;
    },
};