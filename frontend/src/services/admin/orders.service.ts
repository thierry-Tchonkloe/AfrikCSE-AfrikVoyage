import api from "@/lib/api";
import { Order, OrderStatus, OrderPaymentStatus } from "@/types";

export interface AdminOrdersFilters {
    status?:         OrderStatus;
    paymentStatus?:  OrderPaymentStatus;
    organizationId?: string;
    partnerId?:      string;
    from?:           string;
    to?:             string;
    page?:           number;
    limit?:          number;
}

export interface AdminOrderRow extends Order {
    user?:         { id: string; firstName: string; lastName: string; email: string } | null;
    organization?: { id: string; name: string } | null;
}

export const adminOrdersService = {
    async list(filters: AdminOrdersFilters = {}): Promise<{ orders: AdminOrderRow[]; total: number; page: number; limit: number }> {
        const { data } = await api.get("/orders/admin/all", { params: filters });
        return data;
    },
};
