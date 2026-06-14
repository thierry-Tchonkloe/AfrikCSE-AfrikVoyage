import { prisma } from "../../../core/config/prisma";

export interface AuditLogFilters {
    userId?: string;
    action?: string;
    entity?: string;
    organizationId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}

function buildWhere(filters: AuditLogFilters) {
    const { userId, action, entity, organizationId, dateFrom, dateTo, search } = filters;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (organizationId) where.organizationId = organizationId;
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(`${dateFrom}T00:00:00.000Z`);
        if (dateTo) where.createdAt.lte = new Date(`${dateTo}T23:59:59.999Z`);
    }
    if (search) {
        where.OR = [
            { organization: { name: { contains: search, mode: "insensitive" } } },
            { user: { firstName: { contains: search, mode: "insensitive" } } },
            { user: { lastName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }
    return where;
}

const INCLUDE = {
    user: { select: { firstName: true, lastName: true, email: true, role: true } },
    organization: { select: { name: true } },
} as const;

export class AuditLogRepository {
    async findPaginated(params: { page: number; limit: number } & AuditLogFilters) {
        const { page, limit, ...filters } = params;
        const skip = (page - 1) * limit;
        const where = buildWhere(filters);

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: INCLUDE,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    }

    async findAllForExport(filters: AuditLogFilters) {
        return prisma.auditLog.findMany({
            where: buildWhere(filters),
            orderBy: { createdAt: "desc" },
            include: INCLUDE,
        });
    }

    /** Liste des actions distinctes — pour peupler le filtre côté front */
    async getDistinctActions(): Promise<string[]> {
        const rows = await prisma.auditLog.findMany({
            distinct: ["action"],
            select: { action: true },
            orderBy: { action: "asc" },
        });
        return rows.map((r) => r.action);
    }
}
