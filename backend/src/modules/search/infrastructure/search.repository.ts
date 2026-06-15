import { prisma } from "../../../core/config/prisma";

const RESULT_LIMIT = 5;

export class SearchRepository {
    /** Voyages, notes de frais, avantages et événements de l'employé connecté */
    async searchEmployee(userId: string, organizationId: string, q: string) {
        const [travels, expenses, benefits, events] = await Promise.all([
            prisma.travelRequest.findMany({
                where: {
                    requestedById: userId,
                    OR: [
                        { destination: { contains: q, mode: "insensitive" } },
                        { purpose: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: { id: true, destination: true, status: true, departureDate: true },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
            prisma.expenseReport.findMany({
                where: {
                    employee: { userId },
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { destination: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: { id: true, title: true, status: true, amount: true },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
            prisma.benefitRequest.findMany({
                where: {
                    employee: { userId },
                    OR: [
                        { description: { contains: q, mode: "insensitive" } },
                        { category: { name: { contains: q, mode: "insensitive" } } },
                    ],
                },
                select: {
                    id: true, status: true, amount: true,
                    category: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
            prisma.event.findMany({
                where: {
                    organizationId,
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { description: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: { id: true, title: true, startDate: true, status: true },
                orderBy: { startDate: "asc" },
                take: RESULT_LIMIT,
            }),
        ]);

        return { travels, expenses, benefits, events };
    }

    /** Employés, voyages, notes de frais et avantages de l'organisation */
    async searchCompany(organizationId: string, q: string) {
        const [employees, travels, expenses, benefits] = await Promise.all([
            prisma.user.findMany({
                where: {
                    organizationId,
                    OR: [
                        { firstName: { contains: q, mode: "insensitive" } },
                        { lastName: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
                take: RESULT_LIMIT,
            }),
            prisma.travelRequest.findMany({
                where: {
                    organizationId,
                    OR: [
                        { destination: { contains: q, mode: "insensitive" } },
                        { purpose: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true, destination: true, status: true,
                    requestedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
            prisma.expenseReport.findMany({
                where: {
                    organizationId,
                    OR: [
                        { title: { contains: q, mode: "insensitive" } },
                        { destination: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: { id: true, title: true, status: true, amount: true },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
            prisma.benefitRequest.findMany({
                where: {
                    organizationId,
                    OR: [
                        { description: { contains: q, mode: "insensitive" } },
                        { category: { name: { contains: q, mode: "insensitive" } } },
                    ],
                },
                select: {
                    id: true, status: true, amount: true,
                    category: { select: { name: true } },
                    employee: { select: { user: { select: { firstName: true, lastName: true } } } },
                },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
        ]);

        return { employees, travels, expenses, benefits };
    }

    /** Organisations et utilisateurs, toutes organisations confondues */
    async searchAdmin(q: string) {
        const [organizations, users] = await Promise.all([
            prisma.organization.findMany({
                where: {
                    OR: [
                        { name: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                        { slug: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: { id: true, name: true, slug: true, status: true },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
            prisma.user.findMany({
                where: {
                    OR: [
                        { firstName: { contains: q, mode: "insensitive" } },
                        { lastName: { contains: q, mode: "insensitive" } },
                        { email: { contains: q, mode: "insensitive" } },
                    ],
                },
                select: {
                    id: true, firstName: true, lastName: true, email: true,
                    organizationId: true,
                    organization: { select: { name: true } },
                },
                orderBy: { createdAt: "desc" },
                take: RESULT_LIMIT,
            }),
        ]);

        return { organizations, users };
    }
}
