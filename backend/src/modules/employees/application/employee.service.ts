import { EmployeeRepository } from "../infrastructure/employee.repository";

export class EmployeeService {
    private repo = new EmployeeRepository();

    async getAll(orgId: string, filters?: Parameters<EmployeeRepository["findByOrganization"]>[1]) {
        return this.repo.findByOrganization(orgId, filters);
    }

    async getStats(orgId: string) {
        return this.repo.getStats(orgId);
    }

    async getById(id: string) {
        const emp = await this.repo.findById(id);
        if (!emp) throw new Error("Employé introuvable");
        return emp;
    }
}