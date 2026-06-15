// modules/contact/application/contact.service.ts

import { ContactRepository } from "../infrastructure/contact.repository";
import {
    ContactEntity,
    ContactStatus,
    CreateContactInput,
} from "../domain/contact.entity";
import { AppError } from "../../../core/errors/app.error";
import { sendMail } from "../../../core/services/email.service";
import { contactNotificationEmail } from "../../../core/mailer/email.templates";

export class ContactService {
    private repository: ContactRepository;

    constructor() {
        this.repository = new ContactRepository();
    }

    async createContact(data: CreateContactInput): Promise<ContactEntity> {
        const contact = await this.repository.create(data);

        const supportEmail = process.env.SUPPORT_EMAIL;
        if (supportEmail) {
        const { subject, html } = contactNotificationEmail({
            fullName: data.fullName,
            company: data.company,
            email: data.email,
            phone: data.phone,
            message: data.message,
        });
        await sendMail({ to: supportEmail, subject, html });
        }

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