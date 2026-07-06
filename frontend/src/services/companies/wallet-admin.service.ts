// import axios from "axios";
import { WalletWithBalance } from "@/types";

import api from "@/lib/api";

// const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface AllocatePayload {
    userIds:      string[];
    amount:       number;
    period:       string;
    description?: string;
    expiresAt?:   string;
}

export const walletAdminService = {
    async getOrgWallets(): Promise<WalletWithBalance[]> {
        const { data } = await api.get(`/wallet/admin/org`, { withCredentials: true });
        return data;
    },

    async allocate(payload: AllocatePayload): Promise<{ succeeded: number; failed: number; total: number }> {
        const { data } = await api.post(`/wallet/allocate`, payload, { withCredentials: true });
        return data;
    },
};
