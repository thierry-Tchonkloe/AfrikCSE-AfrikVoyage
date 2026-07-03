import { TravelPolicyRepository, TravelPolicyInput } from "../infrastructure/travel-policy.repository";

const repo = new TravelPolicyRepository();

export class TravelPolicyService {
    async list(organizationId: string) { return repo.findAll(organizationId); }
    async getById(id: string, organizationId: string) { return repo.findById(id, organizationId); }
    async create(organizationId: string, userId: string, data: TravelPolicyInput) { return repo.create(organizationId, userId, data); }
    async update(id: string, organizationId: string, data: Partial<TravelPolicyInput>) { return repo.update(id, organizationId, data); }
    async delete(id: string, organizationId: string) { return repo.delete(id, organizationId); }
}
