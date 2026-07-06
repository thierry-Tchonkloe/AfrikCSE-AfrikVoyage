// import axios from "axios";
import { Wallet, WalletEntry } from "@/types";
import api from "@/lib/api";

//const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const walletService = {
    async getMyWallet(): Promise<{ wallet: Wallet; balance: string }> {
        const { data } = await api.get(`/wallet`, { withCredentials: true });
        return data;
    },

    async getEntries(page = 1, limit = 20): Promise<{ entries: WalletEntry[]; total: number; page: number; limit: number }> {
        const { data } = await api.get(`/wallet/entries`, {
            params: { page, limit },
            withCredentials: true,
        });
        return data;
    },
};
