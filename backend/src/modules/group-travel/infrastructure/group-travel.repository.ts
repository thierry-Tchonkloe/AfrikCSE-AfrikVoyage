import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

export interface GroupTravelInput {
    title:           string;
    description?:    string;
    destination:     string;
    departureDate:   Date;
    returnDate:      Date;
    estimatedCost?:  number | null;
    maxParticipants?: number | null;
    currency?:       string;
    notes?:          string;
}

const INCLUDE_FULL = {
    leader: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    participants: {
        include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { invitedAt: "asc" as const },
    },
    _count: { select: { participants: true } },
};

export class GroupTravelRepository {
    async findAll(organizationId: string, userId?: string) {
        return prisma.groupTravel.findMany({
            where: userId
                ? {
                    organizationId,
                    OR: [
                        { leaderId: userId },
                        { participants: { some: { userId } } },
                    ],
                }
                : { organizationId },
            orderBy: { departureDate: "asc" },
            include: INCLUDE_FULL,
        });
    }

    async findById(id: string, organizationId: string) {
        const trip = await prisma.groupTravel.findFirst({
            where: { id, organizationId },
            include: INCLUDE_FULL,
        });
        if (!trip) throw new AppError("Voyage de groupe introuvable", 404);
        return trip;
    }

    async create(organizationId: string, leaderId: string, data: GroupTravelInput) {
        if (data.returnDate <= data.departureDate) {
            throw new AppError("La date de retour doit être postérieure à la date de départ", 422);
        }
        return prisma.groupTravel.create({
            data: { ...data, organizationId, leaderId, status: "OPEN" },
            include: INCLUDE_FULL,
        });
    }

    async update(id: string, organizationId: string, leaderId: string, data: Partial<GroupTravelInput>) {
        const trip = await this.findById(id, organizationId);
        if (trip.leaderId !== leaderId) throw new AppError("Seul l'organisateur peut modifier ce voyage", 403);
        if (trip.status === "CONFIRMED" || trip.status === "COMPLETED") {
            throw new AppError("Un voyage confirmé ou terminé ne peut plus être modifié", 409);
        }
        return prisma.groupTravel.update({ where: { id }, data, include: INCLUDE_FULL });
    }

    async updateStatus(id: string, organizationId: string, leaderId: string, status: string) {
        const trip = await this.findById(id, organizationId);
        if (trip.leaderId !== leaderId) throw new AppError("Seul l'organisateur peut modifier ce voyage", 403);
        return prisma.groupTravel.update({ where: { id }, data: { status: status as any } });
    }

    async delete(id: string, organizationId: string, leaderId: string) {
        const trip = await this.findById(id, organizationId);
        if (trip.leaderId !== leaderId) throw new AppError("Seul l'organisateur peut supprimer ce voyage", 403);
        if (trip.status !== "DRAFT") throw new AppError("Seul un voyage en brouillon peut être supprimé", 409);
        await prisma.groupTravelParticipant.deleteMany({ where: { groupTravelId: id } });
        return prisma.groupTravel.delete({ where: { id } });
    }

    async invite(groupTravelId: string, organizationId: string, leaderId: string, userId: string) {
        const trip = await this.findById(groupTravelId, organizationId);
        if (trip.leaderId !== leaderId) throw new AppError("Seul l'organisateur peut inviter des membres", 403);
        if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
            throw new AppError("Impossible d'inviter sur un voyage terminé ou annulé", 409);
        }
        const count = await prisma.groupTravelParticipant.count({ where: { groupTravelId, status: "CONFIRMED" } });
        if (trip.maxParticipants && count >= trip.maxParticipants) {
            throw new AppError("Nombre maximum de participants atteint", 422);
        }
        return prisma.groupTravelParticipant.upsert({
            where: { groupTravelId_userId: { groupTravelId, userId } },
            create: { groupTravelId, userId, status: "INVITED" },
            update: { status: "INVITED", respondedAt: null },
        });
    }

    async respond(groupTravelId: string, userId: string, accept: boolean, note?: string) {
        const participation = await prisma.groupTravelParticipant.findUnique({
            where: { groupTravelId_userId: { groupTravelId, userId } },
        });
        if (!participation) throw new AppError("Invitation introuvable", 404);
        if (participation.status !== "INVITED") throw new AppError("Cette invitation a déjà reçu une réponse", 409);
        return prisma.groupTravelParticipant.update({
            where: { groupTravelId_userId: { groupTravelId, userId } },
            data: {
                status: accept ? "CONFIRMED" : "DECLINED",
                respondedAt: new Date(),
                note,
            },
        });
    }
}
