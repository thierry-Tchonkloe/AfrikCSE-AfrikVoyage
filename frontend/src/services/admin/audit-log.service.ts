import api from "@/lib/api";

export interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue: unknown;
    newValue: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    userId: string | null;
    organizationId: string | null;
    user: { firstName: string; lastName: string; email: string; role: string } | null;
    organization: { name: string } | null;
}

export interface AuditLogPage {
    data: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface AuditLogFilters {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    organizationId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

export const auditLogService = {
    async getAll(params: AuditLogFilters): Promise<AuditLogPage> {
        const { data } = await api.get("/audit-logs", { params });
        return data;
    },

    async getActions(): Promise<string[]> {
        const { data } = await api.get("/audit-logs/actions");
        return data;
    },

    async export(params: AuditLogFilters): Promise<Blob> {
        const { data } = await api.get("/audit-logs/export", {
            params,
            responseType: "blob",
        });
        return data as Blob;
    },
};
