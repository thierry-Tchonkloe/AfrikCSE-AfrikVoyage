import { prisma } from "../../../core/config/prisma";
import { Role } from "@prisma/client";

export class EmployeeRepository {
    async findByOrganization(orgId: string, filters?: {
        search?: string;
        status?: string;
        role?: string;
        page?: number;
        limit?: number;
    }) {
        const { search, status, role, page = 1, limit = 10 } = filters ?? {};
        const skip = (page - 1) * limit;

        const where: any = { organizationId: orgId };

        if (search) {
        where.OR = [
            { user: { firstName: { contains: search, mode: "insensitive" } } },
            { user: { lastName:  { contains: search, mode: "insensitive" } } },
            { user: { email:     { contains: search, mode: "insensitive" } } },
            { matricule: { contains: search, mode: "insensitive" } },
        ];
        }

        if (status === "ACTIVE")   where.user = { ...where.user, isActive: true };
        if (status === "INACTIVE") where.user = { ...where.user, isActive: false };
        if (role) where.user = { ...where.user, role: role as Role };

        const [data, total] = await Promise.all([
        prisma.employee.findMany({
            where,
            skip,
            take: limit,
            include: {
            user: {
                select: {
                id: true, email: true, firstName: true, lastName: true,
                role: true, isActive: true, jobTitle: true,
                department: true, lastLoginAt: true,
                },
            },
            manager: {
                include: {
                user: { select: { firstName: true, lastName: true } },
                },
            },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.employee.count({ where }),
        ]);

        return { data, total, page, totalPages: Math.ceil(total / limit) };
    }

    async getStats(orgId: string) {
        const [active, total, managers, suspended] = await Promise.all([
        prisma.user.count({ where: { organizationId: orgId, isActive: true } }),
        prisma.user.count({ where: { organizationId: orgId } }),
        prisma.user.count({ where: { organizationId: orgId, role: "MANAGER" } }),
        prisma.user.count({ where: { organizationId: orgId, isActive: false } }),
        ]);

        // Nombre de départements distincts
        const deptResult = await prisma.user.groupBy({
        by: ["department"],
        where: { organizationId: orgId, department: { not: null } },
        });

        return {
        active,
        total,
        managers,
        suspended,
        departments: deptResult.length,
        };
    }

    async findById(id: string) {
        return prisma.employee.findUnique({
        where: { id },
        include: {
            user: true,
            manager: { include: { user: true } },
        },
        });
    }

    async findByUserId(userId: string) {
        return prisma.employee.findUnique({
        where: { userId },
        include: { user: true },
        });
    }
}