import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

export interface FaqInput {
    question:  string;
    answer:    string;
    category?: string;
    order?:    number;
    status?:   "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

const INCLUDE_PUBLIC = {
    _count: { select: { votes: true } },
};

const INCLUDE_ADMIN = {
    createdBy: { select: { id: true, firstName: true, lastName: true } },
    _count:    { select: { votes: true } },
};

export class FaqRepository {
    async findPublished(organizationId: string, category?: string) {
        return prisma.faqEntry.findMany({
            where: { organizationId, status: "PUBLISHED", ...(category ? { category } : {}) },
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            include: INCLUDE_PUBLIC,
        });
    }

    async findAll(organizationId: string) {
        return prisma.faqEntry.findMany({
            where: { organizationId },
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            include: INCLUDE_ADMIN,
        });
    }

    async findById(id: string, organizationId: string) {
        const entry = await prisma.faqEntry.findFirst({ where: { id, organizationId }, include: INCLUDE_ADMIN });
        if (!entry) throw new AppError("Entrée FAQ introuvable", 404);
        return entry;
    }

    async create(organizationId: string, createdById: string, data: FaqInput) {
        return prisma.faqEntry.create({
            data: { ...data, organizationId, createdById },
            include: INCLUDE_ADMIN,
        });
    }

    async update(id: string, organizationId: string, data: Partial<FaqInput>) {
        await this.findById(id, organizationId);
        return prisma.faqEntry.update({ where: { id }, data, include: INCLUDE_ADMIN });
    }

    async delete(id: string, organizationId: string) {
        await this.findById(id, organizationId);
        await prisma.faqVote.deleteMany({ where: { faqEntryId: id } });
        return prisma.faqEntry.delete({ where: { id } });
    }

    async vote(faqEntryId: string, organizationId: string, userId: string, helpful: boolean) {
        const entry = await prisma.faqEntry.findFirst({ where: { id: faqEntryId, organizationId } });
        if (!entry || entry.status !== "PUBLISHED") throw new AppError("Entrée FAQ introuvable", 404);

        await prisma.faqVote.upsert({
            where: { faqEntryId_userId: { faqEntryId, userId } },
            create: { faqEntryId, userId, helpful },
            update: { helpful },
        });

        return prisma.faqVote.groupBy({
            by: ["helpful"],
            where: { faqEntryId },
            _count: { helpful: true },
        });
    }

    async getCategories(organizationId: string): Promise<string[]> {
        const rows = await prisma.faqEntry.findMany({
            where: { organizationId, status: "PUBLISHED", category: { not: null } },
            select: { category: true },
            distinct: ["category"],
            orderBy: { category: "asc" },
        });
        return rows.map(r => r.category!);
    }
}
