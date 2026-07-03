import { GroupTravelRepository, GroupTravelInput } from "../infrastructure/group-travel.repository";

const repo = new GroupTravelRepository();

export class GroupTravelService {
    async list(organizationId: string, userId: string) { return repo.findAll(organizationId, userId); }
    async listAll(organizationId: string)               { return repo.findAll(organizationId); }
    async getById(id: string, organizationId: string)  { return repo.findById(id, organizationId); }

    async create(organizationId: string, leaderId: string, data: GroupTravelInput) {
        return repo.create(organizationId, leaderId, data);
    }
    async update(id: string, organizationId: string, leaderId: string, data: Partial<GroupTravelInput>) {
        return repo.update(id, organizationId, leaderId, data);
    }
    async updateStatus(id: string, organizationId: string, leaderId: string, status: string) {
        return repo.updateStatus(id, organizationId, leaderId, status);
    }
    async delete(id: string, organizationId: string, leaderId: string) {
        return repo.delete(id, organizationId, leaderId);
    }
    async invite(groupTravelId: string, organizationId: string, leaderId: string, userId: string) {
        return repo.invite(groupTravelId, organizationId, leaderId, userId);
    }
    async respond(groupTravelId: string, userId: string, accept: boolean, note?: string) {
        return repo.respond(groupTravelId, userId, accept, note);
    }
}
