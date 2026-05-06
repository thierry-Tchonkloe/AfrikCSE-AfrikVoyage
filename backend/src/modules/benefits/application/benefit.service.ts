import { BenefitRepository } from "../infrastructure/benefit.repository";
import { RequestStatus, Urgency } from "@prisma/client";

export class BenefitService {
    private repo = new BenefitRepository();

    async getCategories(orgId: string) {
        const cats = await this.repo.getCategories(orgId);
        // Calcule le budget utilisé pour chaque catégorie
        return cats.map((c) => ({
        ...c,
        budgetUsed: c.requests.reduce((sum, r) => sum + r.amount, 0),
        requests: undefined, // ne pas exposer le détail
        }));
    }

    async createCategory(orgId: string, data: Parameters<BenefitRepository["createCategory"]>[1]) {
        return this.repo.createCategory(orgId, data);
    }

    async updateCategory(id: string, data: Parameters<BenefitRepository["updateCategory"]>[1]) {
        return this.repo.updateCategory(id, data);
    }

    async deleteCategory(id: string) {
        return this.repo.deleteCategory(id);
    }

    async getRequests(orgId: string, filters?: {
        status?: string;
        categoryId?: string;
        urgency?: string;
        page?: number;
        limit?: number;
    }) {
        return this.repo.getRequests(orgId, {
        status: filters?.status as RequestStatus,
        categoryId: filters?.categoryId,
        urgency: filters?.urgency as Urgency,
        page: filters?.page,
        limit: filters?.limit,
        });
    }

    async getApprovalStats(orgId: string) {
        return this.repo.getApprovalStats(orgId);
    }

    async approveRequest(id: string, approverId: string) {
        return this.repo.approveRequest(id, approverId);
    }

    async rejectRequest(id: string, note: string) {
        if (!note?.trim()) throw new Error("Note de rejet requise");
        return this.repo.rejectRequest(id, note);
    }

    async bulkApprove(ids: string[], approverId: string) {
        if (!ids.length) throw new Error("Aucune demande sélectionnée");
        return this.repo.bulkApprove(ids, approverId);
    }

    async getBudgetReport(orgId: string, year: number) {
        return this.repo.getBudgetReport(orgId, year);
    }
}