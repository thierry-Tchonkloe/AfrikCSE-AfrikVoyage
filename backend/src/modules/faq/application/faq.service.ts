import { FaqRepository, FaqInput } from "../infrastructure/faq.repository";

const repo = new FaqRepository();

export class FaqService {
    async listPublished(organizationId: string, category?: string) { return repo.findPublished(organizationId, category); }
    async listAll(organizationId: string)                          { return repo.findAll(organizationId); }
    async getById(id: string, organizationId: string)              { return repo.findById(id, organizationId); }
    async create(organizationId: string, createdById: string, data: FaqInput) { return repo.create(organizationId, createdById, data); }
    async update(id: string, organizationId: string, data: Partial<FaqInput>) { return repo.update(id, organizationId, data); }
    async delete(id: string, organizationId: string)               { return repo.delete(id, organizationId); }
    async vote(faqEntryId: string, userId: string, helpful: boolean) { return repo.vote(faqEntryId, userId, helpful); }
    async getCategories(organizationId: string)                    { return repo.getCategories(organizationId); }
}
