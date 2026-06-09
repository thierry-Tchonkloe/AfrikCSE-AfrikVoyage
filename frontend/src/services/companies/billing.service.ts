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

    async upgradePlan(plan: string) {
        const { data } = await api.post("/billing/upgrade", { plan });
        return data;
    },

    async getPlans() {
        const { data } = await api.get("/billing/plans");
        return data;
    },

    // KkiaPay : appeler après succès du widget KkiaPay côté frontend
    // transactionId est retourné par le widget KkiaPay (callback onSuccess)
    async confirmKkiapay(plan: string, transactionId: string, currency = "XOF") {
        const { data } = await api.post("/billing/pay/kkiapay", { plan, transactionId, currency });
        return data;
    },

    // FedaPay : le backend crée la transaction et retourne checkoutUrl
    // Le frontend redirige l'utilisateur vers checkoutUrl
    async initiateFedapay(plan: string, currency = "XOF") {
        const { data } = await api.post("/billing/pay/fedapay", { plan, currency });
        return data as { checkoutUrl: string | null; transactionRef?: string; message: string };
    },

    // Carte : envoie les données carte au backend
    async payWithCard(plan: string, cardData: { cardNumber: string; expiry: string; cvv: string }) {
        const { data } = await api.post("/billing/pay/card", { plan, ...cardData });
        return data;
    },
};
