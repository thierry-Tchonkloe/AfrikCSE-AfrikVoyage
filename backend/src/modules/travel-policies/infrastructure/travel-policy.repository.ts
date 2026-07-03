import { prisma } from "../../../core/config/prisma";
import { AppError } from "../../../core/errors/app.error";

export interface TravelPolicyInput {
    name:                   string;
    description?:           string;
    isDefault?:             boolean;
    isActive?:              boolean;
    maxFlightBudget?:       number | null;
    maxHotelBudgetPerNight?: number | null;
    maxDailyAllowance?:     number | null;
    currency?:              string;
    allowedFlightClass?:    string | null;
    maxAdvanceBookingDays?: number | null;
    requiresApproval?:      boolean;
    approvalThreshold?:     number | null;
    allowedDestinations?:   string[];
    restrictedDestinations?: string[];
    appliesToDepartments?:  string[];
}

export class TravelPolicyRepository {
    async findAll(organizationId: string) {
        return prisma.travelPolicy.findMany({
            where: { organizationId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
            include: { _count: { select: { travelRequests: true } } },
        });
    }

    async findById(id: string, organizationId: string) {
        const policy = await prisma.travelPolicy.findFirst({ where: { id, organizationId } });
        if (!policy) throw new AppError("Politique de voyage introuvable", 404);
        return policy;
    }

    async create(organizationId: string, _createdBy: string, data: TravelPolicyInput) {
        if (data.isDefault) await this.clearDefault(organizationId);
        return prisma.travelPolicy.create({
            data: {
                ...data,
                organizationId,
                // ignore createdBy — pas de champ dans le modèle, juste pour audit
            },
        });
    }

    async update(id: string, organizationId: string, data: Partial<TravelPolicyInput>) {
        await this.findById(id, organizationId);
        if (data.isDefault) await this.clearDefault(organizationId, id);
        return prisma.travelPolicy.update({ where: { id }, data });
    }

    async delete(id: string, organizationId: string) {
        await this.findById(id, organizationId);
        const linked = await prisma.travelRequest.count({ where: { policyId: id } });
        if (linked > 0) {
            throw new AppError("Cette politique est liée à des demandes de voyage — désactivez-la plutôt.", 409);
        }
        return prisma.travelPolicy.delete({ where: { id } });
    }

    // Dé-marque toute politique par défaut avant d'en définir une nouvelle
    private async clearDefault(organizationId: string, exceptId?: string) {
        await prisma.travelPolicy.updateMany({
            where: { organizationId, isDefault: true, id: { not: exceptId } },
            data:  { isDefault: false },
        });
    }
}
