/**
 * Entité User — représentation métier pure, sans dépendance Prisma
 * Utilisée pour les règles métier et les transformations
 */
export class UserEntity {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly firstName: string,
        public readonly lastName: string,
        public readonly role: string,
        public readonly organizationId: string | null,
        public readonly isActive: boolean
    ) {}

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    /** Un admin entreprise ne peut gérer que les rôles sous le sien */
    canManageRole(targetRole: string): boolean {
        const hierarchy = ["EMPLOYE", "FINANCE", "RH", "MANAGER", "ADMIN_ENTREPRISE", "SUPER_ADMIN"];
        const myIndex = hierarchy.indexOf(this.role);
        const targetIndex = hierarchy.indexOf(targetRole);
        // On peut gérer uniquement les rôles INFÉRIEURS au sien
        return myIndex > targetIndex;
    }
}