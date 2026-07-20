import { EventPhotoRepository } from "../infrastructure/event-photo.repository";

const repo = new EventPhotoRepository();

export class EventPhotoService {
    // Employés voient uniquement les APPROVED ; admins voient tout
    async listByEvent(eventId: string, organizationId: string, isAdmin: boolean) {
        return repo.findByEvent(eventId, organizationId, !isAdmin);
    }

    async getById(id: string, organizationId: string) {
        return repo.findById(id, organizationId);
    }

    async upload(data: { eventId: string; organizationId: string; uploadedBy: string; url: string; caption?: string }) {
        return repo.create(data);
    }

    async moderate(id: string, organizationId: string, status: "APPROVED" | "REJECTED") {
        return repo.moderate(id, organizationId, status);
    }

    async delete(id: string, organizationId: string, requesterId: string, isAdmin: boolean) {
        return repo.delete(id, organizationId, requesterId, isAdmin);
    }

    async toggleLike(photoId: string, organizationId: string, userId: string) {
        return repo.toggleLike(photoId, organizationId, userId);
    }

    async getPendingCount(organizationId: string) {
        return repo.getPendingCount(organizationId);
    }
}
