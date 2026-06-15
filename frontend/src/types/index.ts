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
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    role: Role;
    profileCompleted: boolean;
    organizationId: string | null;
    organization: Organization | null;
}

export type NotificationType =
    | "APPROVAL_REQUEST"
    | "REQUEST_APPROVED"
    | "REQUEST_REJECTED"
    | "TRIP_REMINDER"
    | "NEW_EVENT"
    | "MESSAGE_RECEIVED"
    | "SYSTEM_UPDATE";

export interface Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    link?: string | null;
    read: boolean;
    createdAt: string;
}

export interface AuthResponse {
    // access/refresh peuvent être absents car les cookies HTTP-only sont posés
    accessToken?: string;
    refreshToken?: string;
    // jeton court signé fourni pour le middleware (lisible par le frontend)
    sessionToken?: string;
    user: User;
}