import api from "@/lib/api";

export interface PlanConfig {
    id: string;
    name: string;
    label: string;
    price: string;
    maxUsers: number | null;
    hasVoyage: boolean;
    hasCSE: boolean;
    features: string[];
    isActive: boolean;
    orgCount: number;
    pricePerEmployee: string | null;
    billingCycle: string | null;
    apiAccess: boolean;
    webhookAccess: boolean;
    createdAt: string;
    updatedAt: string;
}

export type PlanConfigPayload = {
    name?: string;
    label: string;
    price: string;
    maxUsers: number | null;
    hasVoyage: boolean;
    hasCSE: boolean;
    features: string[];
    isActive: boolean;
    pricePerEmployee?: number;
    billingCycle?: string;
    apiAccess?: boolean;
    webhookAccess?: boolean;
};

export interface PublicPlan {
    name: string;
    label: string;
    price: string;
    maxUsers: number | null;
    hasVoyage: boolean;
    hasCSE: boolean;
    features: string[];
}

export const plansService = {
    async getAll(): Promise<PlanConfig[]> {
        const { data } = await api.get("/plan-configs");
        return data;
    },

    /** Liste publique des plans actifs — pour la page tarifs du site vitrine */
    async getPublic(): Promise<PublicPlan[]> {
        const { data } = await api.get("/plan-configs/public");
        return data;
    },

    async create(payload: PlanConfigPayload) {
        const { data } = await api.post("/plan-configs", payload);
        return data;
    },

    async update(id: string, payload: Partial<PlanConfigPayload>) {
        const { data } = await api.patch(`/plan-configs/${id}`, payload);
        return data;
    },

    async remove(id: string) {
        const { data } = await api.delete(`/plan-configs/${id}`);
        return data;
    },
};
