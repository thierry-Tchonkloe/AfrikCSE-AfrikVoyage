import api from "@/lib/api";

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
    async payWithKkiapay(plan: string, transactionId: string) {
        const { data } = await api.post("/billing/pay/kkiapay", { plan, transactionId });
        return data;
    },
    async payWithFedapay(plan: string) {
        const { data } = await api.post("/billing/pay/fedapay", { plan });
        return data;
    },
};