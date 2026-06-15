import { BenefitRepository } from "../infrastructure/benefit.repository";
import { NotificationRepository } from "../../notification/infrastructure/notification.repository";
import { RequestStatus, Urgency } from "@prisma/client";

export class BenefitService {
    private repo = new BenefitRepository();
    private notificationRepo = new NotificationRepository();

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
        const result = await this.repo.approveRequest(id, approverId);
        await this.notificationRepo.createForUsers(
            [result.employee.userId],
            "Demande d'avantage approuvée",
            `Votre demande « ${result.category.name} » a été approuvée.`,
            "REQUEST_APPROVED",
            "/employes/avantages"
        );
        return result;
    }

    async rejectRequest(id: string, note: string) {
        if (!note?.trim()) throw new Error("Note de rejet requise");
        const result = await this.repo.rejectRequest(id, note);
        await this.notificationRepo.createForUsers(
            [result.employee.userId],
            "Demande d'avantage rejetée",
            `Votre demande « ${result.category.name} » a été rejetée. Motif : ${result.rejectionNote}`,
            "REQUEST_REJECTED",
            "/employes/avantages"
        );
        return result;
    }

    async bulkApprove(ids: string[], approverId: string) {
        if (!ids.length) throw new Error("Aucune demande sélectionnée");
        const result = await this.repo.bulkApprove(ids, approverId);
        for (const request of result.requests) {
            await this.notificationRepo.createForUsers(
                [request.employee.userId],
                "Demande d'avantage approuvée",
                `Votre demande « ${request.category.name} » a été approuvée.`,
                "REQUEST_APPROVED",
                "/employes/avantages"
            );
        }
        return { count: result.count };
    }

    async getBudgetReport(orgId: string, year: number, filters?: {
        department?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        return this.repo.getBudgetReport(orgId, year, filters);
    }

    async getComplianceReport(orgId: string) {
        return this.repo.getComplianceReport(orgId);
    }
}