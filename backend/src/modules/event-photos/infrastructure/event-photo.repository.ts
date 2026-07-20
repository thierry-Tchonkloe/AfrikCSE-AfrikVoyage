import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

const INCLUDE = {
    uploader: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    _count:   { select: { likes: true } },
};

export class EventPhotoRepository {
    async findByEvent(eventId: string, organizationId: string, onlyApproved = false) {
        return prisma.eventPhoto.findMany({
            where: {
                eventId,
                organizationId,
                ...(onlyApproved ? { status: "APPROVED" } : {}),
            },
            orderBy: { createdAt: "desc" },
            include: INCLUDE,
        });
    }

    async findById(id: string, organizationId: string) {
        const photo = await prisma.eventPhoto.findFirst({ where: { id, organizationId }, include: INCLUDE });
        if (!photo) throw new AppError("Photo introuvable", 404);
        return photo;
    }

    async create(data: {
        eventId:        string;
        organizationId: string;
        uploadedBy:     string;
        url:            string;
        caption?:       string;
    }) {
        // Vérifie que l'événement appartient à l'org
        const event = await prisma.event.findFirst({ where: { id: data.eventId, organizationId: data.organizationId } });
        if (!event) throw new AppError("Événement introuvable", 404);
        return prisma.eventPhoto.create({ data, include: INCLUDE });
    }

    async moderate(id: string, organizationId: string, status: "APPROVED" | "REJECTED") {
        await this.findById(id, organizationId);
        return prisma.eventPhoto.update({ where: { id }, data: { status }, include: INCLUDE });
    }

    async delete(id: string, organizationId: string, requesterId: string, isAdmin: boolean) {
        const photo = await this.findById(id, organizationId);
        if (!isAdmin && photo.uploadedBy !== requesterId) {
            throw new AppError("Vous ne pouvez supprimer que vos propres photos", 403);
        }
        await prisma.eventPhotoLike.deleteMany({ where: { photoId: id } });
        return prisma.eventPhoto.delete({ where: { id } });
    }

    async toggleLike(photoId: string, organizationId: string, userId: string): Promise<{ liked: boolean; count: number }> {
        await this.findById(photoId, organizationId);

        const existing = await prisma.eventPhotoLike.findUnique({
            where: { photoId_userId: { photoId, userId } },
        });

        if (existing) {
            await prisma.eventPhotoLike.delete({ where: { photoId_userId: { photoId, userId } } });
        } else {
            await prisma.eventPhotoLike.create({ data: { photoId, userId } });
        }

        const count = await prisma.eventPhotoLike.count({ where: { photoId } });
        return { liked: !existing, count };
    }

    async getPendingCount(organizationId: string): Promise<number> {
        return prisma.eventPhoto.count({ where: { organizationId, status: "PENDING" } });
    }
}
