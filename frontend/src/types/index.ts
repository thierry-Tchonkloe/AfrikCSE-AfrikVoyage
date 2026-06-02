export type Role =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "MANAGER"
    | "RH"
    | "FINANCE"
    | "EMPLOYE";

export type OrgStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
export type Plan = "STARTER" | "BUSINESS" | "ENTERPRISE";

export interface Organization {
    id: string;
    name: string;
    slug?: string;
    status?: OrgStatus;
    plan?: Plan;
    hasVoyage: boolean;
    hasCSE: boolean;
    isHost: boolean;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    profileCompleted: boolean;
    organizationId: string | null;
    organization: Organization | null;
}

export interface AuthResponse {
    // access/refresh peuvent être absents car les cookies HTTP-only sont posés
    accessToken?: string;
    refreshToken?: string;
    // jeton court signé fourni pour le middleware (lisible par le frontend)
    sessionToken?: string;
    user: User;
}