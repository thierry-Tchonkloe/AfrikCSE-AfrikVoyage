// modules/contact/domain/contact.entity.ts

export type ContactStatus = "PENDING" | "IN_PROGRESS" | "DONE";

export interface ContactEntity {
    id: number;
    fullName: string;
    company: string;
    email: string;
    phone: string;
    companySize: string;
    message: string;
    acceptMarketing: boolean;
    status: ContactStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateContactInput {
    fullName: string;
    company: string;
    email: string;
    phone?: string;
    companySize?: string;
    message: string;
    acceptMarketing?: boolean;
}