import { BenefitRepository } from "../infrastructure/benefit.repository";
import { dispatchNotificationToUsers } from "../../notification/application/notification.service";
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

    async updateCategory(id: string, organizationId: string, data: Parameters<BenefitRepository["updateCategory"]>[2]) {
        return this.repo.updateCategory(id, organizationId, data);
    }

    async deleteCategory(id: string, organizationId: string) {
        return this.repo.deleteCategory(id, organizationId);
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

    async approveRequest(id: string, organizationId: string, approverId: string) {
        const result = await this.repo.approveRequest(id, organizationId, approverId);
        if (!result) throw new Error("Cette demande a déjà été traitée");
        dispatchNotificationToUsers(
            "REQUEST_APPROVED",
            [result.employee.userId],
            { requestType: "demande d'avantage", subject: result.category.name },
            "/employes/avantages"
        ).catch(() => {});
        return result;
    }

    async rejectRequest(id: string, organizationId: string, note: string) {
        if (!note?.trim()) throw new Error("Note de rejet requise");
        const result = await this.repo.rejectRequest(id, organizationId, note);
        if (!result) throw new Error("Cette demande a déjà été traitée");
        dispatchNotificationToUsers(
            "REQUEST_REJECTED",
            [result.employee.userId],
            { requestType: "demande d'avantage", subject: result.category.name, reason: result.rejectionNote ?? "" },
            "/employes/avantages"
        ).catch(() => {});
        return result;
    }

    async bulkApprove(ids: string[], organizationId: string, approverId: string) {
        if (!ids.length) throw new Error("Aucune demande sélectionnée");
        const result = await this.repo.bulkApprove(ids, organizationId, approverId);
        for (const request of result.requests) {
            dispatchNotificationToUsers(
                "REQUEST_APPROVED",
                [request.employee.userId],
                { requestType: "demande d'avantage", subject: request.category.name },
                "/employes/avantages"
            ).catch(() => {});
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