import { Wallet, WalletEntry } from "@/types";
import api from "@/lib/api";

export interface CashbackTransaction {
    id:             string;
    rawAmount:      string;
    creditedAmount: string;
    status:         "CALCULATED" | "CREDITED" | "PENDING_REVIEW" | "REJECTED";
    currencyCode:   string;
    orderId?:       string | null;
    createdAt:      string;
    rule?: {
        type:        string;
        rate:        string;
        currencyCode: string;
    } | null;
}

export const walletService = {
    async getMyWallet(): Promise<{ wallet: Wallet; balance: string }> {
        const { data } = await api.get(`/wallet`, { withCredentials: true });
        return data;
    },

    async getEntries(page = 1, limit = 20): Promise<{ entries: WalletEntry[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/wallet/entries`, { params: { page, limit }, withCredentials: true });
        return data;
    },

    async getMyCashback(page = 1, limit = 20): Promise<{ transactions: CashbackTransaction[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/cashback/my`, { params: { page, limit }, withCredentials: true });
        return data;
    },
};
