import { FamilyMemberRepository, FamilyMemberInput } from "../infrastructure/family-member.repository";
import { AppError } from "../../../core/errors/app.error";
import { prisma } from "../../../core/config/prisma";

const repo = new FamilyMemberRepository();

export class FamilyMemberService {
    async list(userId: string, organizationId: string) {
        return repo.findAllByUser(userId, organizationId);
    }

    async getById(id: string, userId: string) {
        const member = await repo.findById(id);
        if (!member || member.userId !== userId) {
            throw new AppError("Membre de famille introuvable", 404);
        }
        return member;
    }

    async create(userId: string, organizationId: string, data: FamilyMemberInput) {
        // Respecte la limite de maxFamilyMembers de l'org
        const [count, org] = await Promise.all([
            repo.countActiveByUser(userId, organizationId),
            prisma.organization.findUniqueOrThrow({
                where: { id: organizationId },
                select: { maxFamilyMembers: true },
            }),
        ]);

        if (count >= org.maxFamilyMembers) {
            throw new AppError(
                `Limite atteinte — votre organisation autorise au maximum ${org.maxFamilyMembers} membres de famille.`,
                422
            );
        }

        return repo.create(userId, organizationId, data);
    }

    async update(id: string, userId: string, data: Partial<FamilyMemberInput>) {
        await this.getById(id, userId);
        return repo.update(id, data);
    }

    async delete(id: string, userId: string) {
        await this.getById(id, userId);
        return repo.delete(id);
    }
}
