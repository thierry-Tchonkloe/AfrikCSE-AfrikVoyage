// modules/contact/application/contact.service.ts

import { ContactRepository } from "../infrastructure/contact.repository";
import {
    ContactEntity,
    ContactStatus,
    CreateContactInput,
} from "../domain/contact.entity";
import { AppError } from "../../../core/errors/app.error";

export class ContactService {
    private repository: ContactRepository;

    constructor() {
        this.repository = new ContactRepository();
    }

    async createContact(data: CreateContactInput): Promise<ContactEntity> {
        const contact = await this.repository.create(data);
        // Optional: await sendNotificationEmail(contact);
        return contact;
    }

    async getAllContacts(): Promise<ContactEntity[]> {
        return this.repository.findAll();
    }

    async updateStatus(
        id: number,
        status: ContactStatus
    ): Promise<ContactEntity> {
        const existing = await this.repository.findById(id);
        if (!existing) {
        throw new AppError("Demande introuvable", 404);
        }

        const allowed: ContactStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];
        if (!allowed.includes(status)) {
        throw new AppError("Statut invalide", 400);
        }

        return this.repository.updateStatus(id, status);
    }
}