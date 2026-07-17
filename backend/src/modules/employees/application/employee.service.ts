import { EmployeeRepository } from "../infrastructure/employee.repository";

export class EmployeeService {
    private repo = new EmployeeRepository();

    async getAll(orgId: string, filters?: Parameters<EmployeeRepository["findByOrganization"]>[1]) {
        return this.repo.findByOrganization(orgId, filters);
    }

    async getStats(orgId: string) {
        return this.repo.getStats(orgId);
    }

    /** Cantonné à l'organisation de l'appelant — même message d'erreur si id inconnu ou org différente (anti-IDOR) */
    async getById(orgId: string, id: string) {
        const emp = await this.repo.findById(id);
        if (!emp || emp.organizationId !== orgId) throw new Error("Employé introuvable");
        return emp;
    }
}