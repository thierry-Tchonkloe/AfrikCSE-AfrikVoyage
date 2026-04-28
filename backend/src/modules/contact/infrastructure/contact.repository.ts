// modules/contact/infrastructure/contact.repository.ts

import {prisma} from "../../../core/config/prisma";
import {
    ContactEntity,
    ContactStatus,
    CreateContactInput,
} from "../domain/contact.entity";

export class ContactRepository {
    async create(data: CreateContactInput): Promise<ContactEntity> {
        return prisma.contactRequest.create({
        data: {
            fullName: data.fullName,
            company: data.company,
            email: data.email,
            phone: data.phone ?? "",
            companySize: data.companySize ?? "",
            message: data.message,
            acceptMarketing: data.acceptMarketing ?? false,
            status: "PENDING",
        },
        });
    }

    async findAll(): Promise<ContactEntity[]> {
        return prisma.contactRequest.findMany({
        orderBy: { createdAt: "desc" },
        });
    }

    async findById(id: number): Promise<ContactEntity | null> {
        return prisma.contactRequest.findUnique({
        where: { id },
        });
    }

    async updateStatus(
        id: number,
        status: ContactStatus
    ): Promise<ContactEntity> {
        return prisma.contactRequest.update({
        where: { id },
        data: { status },
        });
    }
}