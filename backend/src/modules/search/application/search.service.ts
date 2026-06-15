import { SearchRepository } from "../infrastructure/search.repository";

export interface SearchResultItem {
    id: string;
    type: "travel" | "expense" | "benefit" | "event" | "employee" | "organization";
    title: string;
    subtitle?: string;
    url: string;
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
    CANCELLED: "Annulé",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminé",
    PUBLISHED: "Publié",
    DRAFT: "Brouillon",
    CANCELED: "Annulé",
    ACTIVE: "Actif",
    SUSPENDED: "Suspendu",
};

function statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
}

function formatAmount(amount: number): string {
    return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export class SearchService {
    private repo = new SearchRepository();

    async searchEmployee(userId: string, organizationId: string, q: string): Promise<SearchResultItem[]> {
        const { travels, expenses, benefits, events } = await this.repo.searchEmployee(userId, organizationId, q);

        const results: SearchResultItem[] = [];

        for (const t of travels) {
            results.push({
                id: t.id,
                type: "travel",
                title: t.destination,
                subtitle: statusLabel(t.status),
                url: "/employes/voyages",
            });
        }
        for (const e of expenses) {
            results.push({
                id: e.id,
                type: "expense",
                title: e.title,
                subtitle: `${formatAmount(e.amount)} · ${statusLabel(e.status)}`,
                url: "/employes/notes-de-frais",
            });
        }
        for (const b of benefits) {
            results.push({
                id: b.id,
                type: "benefit",
                title: b.category.name,
                subtitle: `${formatAmount(b.amount)} · ${statusLabel(b.status)}`,
                url: "/employes/avantages",
            });
        }
        for (const ev of events) {
            results.push({
                id: ev.id,
                type: "event",
                title: ev.title,
                subtitle: ev.startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
                url: "/employes/evenements",
            });
        }

        return results;
    }

    async searchCompany(organizationId: string, q: string): Promise<SearchResultItem[]> {
        const { employees, travels, expenses, benefits } = await this.repo.searchCompany(organizationId, q);

        const results: SearchResultItem[] = [];

        for (const u of employees) {
            results.push({
                id: u.id,
                type: "employee",
                title: `${u.firstName} ${u.lastName}`,
                subtitle: u.jobTitle ?? u.email,
                url: "/companies/users",
            });
        }
        for (const t of travels) {
            results.push({
                id: t.id,
                type: "travel",
                title: t.destination,
                subtitle: `${t.requestedBy.firstName} ${t.requestedBy.lastName} · ${statusLabel(t.status)}`,
                url: "/companies/AfrikVoyage/approbations",
            });
        }
        for (const e of expenses) {
            results.push({
                id: e.id,
                type: "expense",
                title: e.title,
                subtitle: `${formatAmount(e.amount)} · ${statusLabel(e.status)}`,
                url: "/companies/AfrikVoyage/frais",
            });
        }
        for (const b of benefits) {
            results.push({
                id: b.id,
                type: "benefit",
                title: b.category.name,
                subtitle: `${b.employee.user.firstName} ${b.employee.user.lastName} · ${formatAmount(b.amount)}`,
                url: "/companies/AfrikCSE/avantages",
            });
        }

        return results;
    }

    async searchAdmin(q: string): Promise<SearchResultItem[]> {
        const { organizations, users } = await this.repo.searchAdmin(q);

        const results: SearchResultItem[] = [];

        for (const org of organizations) {
            results.push({
                id: org.id,
                type: "organization",
                title: org.name,
                subtitle: statusLabel(org.status),
                url: `/admin/companies/${org.id}`,
            });
        }
        for (const u of users) {
            results.push({
                id: u.id,
                type: "employee",
                title: `${u.firstName} ${u.lastName}`,
                subtitle: `${u.email} · ${u.organization.name}`,
                url: `/admin/companies/${u.organizationId}`,
            });
        }

        return results;
    }
}
