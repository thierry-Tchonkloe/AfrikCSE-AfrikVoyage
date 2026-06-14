import { PlanConfigRepository } from "../infrastructure/plan-config.repository";
import { CreatePlanConfigDto, UpdatePlanConfigDto } from "../interfaces/plan-config.validator";

export class PlanConfigService {
    private repo = new PlanConfigRepository();

    /** Liste les plans avec le nombre d'organisations sur chacun */
    async getAll() {
        const [plans, counts] = await Promise.all([
            this.repo.findAll(),
            this.repo.countOrganizationsByPlan(),
        ]);
        return plans.map((plan) => ({ ...plan, orgCount: counts[plan.name] ?? 0 }));
    }

    /** Liste publique des plans actifs — utilisée par la page tarifs du site vitrine */
    async getPublic() {
        const plans = await this.repo.findAll();
        return plans
            .filter((plan) => plan.isActive)
            .map((plan) => ({
                name: plan.name,
                label: plan.label,
                price: plan.price,
                maxUsers: plan.maxUsers,
                hasVoyage: plan.hasVoyage,
                hasCSE: plan.hasCSE,
                features: plan.features,
            }));
    }

    async getById(id: string) {
        const plan = await this.repo.findById(id);
        if (!plan) throw new Error("Plan introuvable");
        return plan;
    }

    async create(dto: CreatePlanConfigDto) {
        const existing = await this.repo.findByName(dto.name);
        if (existing) throw new Error("Un plan avec ce nom existe déjà");
        return this.repo.create(dto);
    }

    async update(id: string, dto: UpdatePlanConfigDto) {
        const plan = await this.repo.findById(id);
        if (!plan) throw new Error("Plan introuvable");
        return this.repo.update(id, dto);
    }

    async delete(id: string) {
        const plan = await this.repo.findById(id);
        if (!plan) throw new Error("Plan introuvable");

        const counts = await this.repo.countOrganizationsByPlan();
        if ((counts[plan.name] ?? 0) > 0) {
            throw new Error("Impossible de supprimer un plan utilisé par des organisations");
        }

        return this.repo.delete(id);
    }
}
