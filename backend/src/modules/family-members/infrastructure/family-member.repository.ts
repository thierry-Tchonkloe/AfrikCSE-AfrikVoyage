import { prisma } from "../../../core/config/prisma";
import { FamilyRelationship } from "@prisma/client";

export interface FamilyMemberInput {
    firstName:    string;
    lastName:     string;
    relationship: FamilyRelationship;
    birthDate?:   Date;
    documentUrl?: string;
}

export class FamilyMemberRepository {
    async findAllByUser(userId: string, organizationId: string) {
        return prisma.familyMember.findMany({
            where: { userId, organizationId, isActive: true },
            orderBy: { createdAt: "asc" },
        });
    }

    async findById(id: string) {
        return prisma.familyMember.findUnique({ where: { id } });
    }

    async countActiveByUser(userId: string, organizationId: string) {
        return prisma.familyMember.count({
            where: { userId, organizationId, isActive: true },
        });
    }

    async create(userId: string, organizationId: string, data: FamilyMemberInput) {
        return prisma.familyMember.create({
            data: {
                userId,
                organizationId,
                firstName:    data.firstName,
                lastName:     data.lastName,
                relationship: data.relationship,
                birthDate:    data.birthDate,
                documentUrl:  data.documentUrl,
            },
        });
    }

    async update(id: string, data: Partial<FamilyMemberInput>) {
        return prisma.familyMember.update({
            where: { id },
            data: {
                firstName:    data.firstName,
                lastName:     data.lastName,
                relationship: data.relationship,
                birthDate:    data.birthDate,
                documentUrl:  data.documentUrl,
            },
        });
    }

    // Soft-delete : preserve les tickets liés
    async delete(id: string) {
        return prisma.familyMember.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
