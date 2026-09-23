import api from "@/lib/api";

export type PayMethod = "card" | "kkiapay" | "fedapay";

export const billingService = {
    async getSubscription() {
        const { data } = await api.get("/billing");
        return data;
    },

    async getInvoices() {
        const { data } = await api.get("/billing/invoices");
        return data;
    },

    async getPlans() {
        const { data } = await api.get("/billing/plans");
        return data;
    },

    // Prix XOF réels pour l'organisation connectée (reflète PlanConfig.pricePerEmployee
    // dynamique) — contrairement à getPlans() qui renvoie des constantes indicatives.
    async getResolvedPlans() {
        const { data } = await api.get("/billing/plans/resolved");
        return data as { plan: string; priceXOF: number }[];
    },

    // KkiaPay : appeler après succès du widget KkiaPay côté frontend
    // transactionId est retourné par le widget KkiaPay (callback onSuccess)
    // Toujours en XOF — KkiaPay ne facture jamais dans une autre devise ici.
    async confirmKkiapay(plan: string, transactionId: string) {
        const { data } = await api.post("/billing/pay/kkiapay", { plan, transactionId });
        return data;
    },

    // FedaPay : le backend crée la transaction et retourne checkoutUrl
    // Le frontend redirige l'utilisateur vers checkoutUrl. Toujours en XOF.
    async initiateFedapay(plan: string) {
        const { data } = await api.post("/billing/pay/fedapay", { plan });
        return data as { checkoutUrl: string | null; transactionRef?: string; message: string };
    },

    // Carte : envoie les données carte au backend
    async payWithCard(plan: string, cardData: { cardNumber: string; expiry: string; cvv: string }) {
        const { data } = await api.post("/billing/pay/card", { plan, ...cardData });
        return data;
    },

    // Wallet entreprise — trésorerie servant au remboursement des notes de frais.
    async getWalletBalance() {
        const { data } = await api.get("/billing/wallet");
        return data as { balance: number; currencyCode: string };
    },

    async topUpWallet(amount: number) {
        const { data } = await api.post("/billing/wallet/topup", { amount });
        return data as { balance: number; currencyCode: string };
    },
};
