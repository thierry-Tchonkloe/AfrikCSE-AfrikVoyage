import { prisma } from "../../../core/config/prisma";

export class TravelRewardRepository {
    async findByUser(userId: string) {
        return prisma.travelReward.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                travelRequest: { select: { id: true, destination: true, departureDate: true } },
            },
        });
    }

    async getBalance(userId: string): Promise<number> {
        const result = await prisma.travelReward.aggregate({
            where: { userId, status: "EARNED" },
            _sum: { points: true },
        });
        return result._sum.points ?? 0;
    }

    async earn(data: {
        organizationId:  string;
        userId:          string;
        travelRequestId: string;
        points:          number;
        reason:          string;
        estimatedCost?:  number;
        actualCost?:     number;
        savedAmount?:    number;
        currency?:       string;
    }) {
        return prisma.travelReward.create({ data });
    }
}
