import { prisma } from "../../../core/config/prisma";

export class CatalogRepository {
    async getAll(orgId: string, filters?: {
        category?: string;
        search?: string;
        sortBy?: string;
    }) {
        const where: any = { organizationId: orgId, isActive: true };

        if (filters?.category && filters.category !== "all") {
        where.category = { contains: filters.category, mode: "insensitive" };
        }

        if (filters?.search) {
        where.OR = [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
        ];
        }

        const orderBy: any = {};
        if (filters?.sortBy === "price") orderBy.employeePrice = "asc";
        else if (filters?.sortBy === "subsidy") orderBy.subsidyPct = "desc";
        else orderBy.createdAt = "desc";

        return prisma.benefitCatalogItem.findMany({ where, orderBy });
    }

    async getById(id: string) {
        return prisma.benefitCatalogItem.findUnique({ where: { id } });
    }

    async getCategories(orgId: string) {
        const items = await prisma.benefitCatalogItem.groupBy({
        by: ["category"],
        where: { organizationId: orgId, isActive: true },
        });
        return items.map((i) => i.category);
    }
}