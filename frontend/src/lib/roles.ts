// ── Rôles ──────────────────────────────────────────────────
export const SUPER_ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER"];
// ADMIN (pas ADMIN_ENTREPRISE) + les autres rôles company
export const COMPANY_ADMIN_ROLES = ["ADMIN", "MANAGER", "RH", "FINANCE"];

/** Route par défaut d'un utilisateur selon son rôle et son organisation */
export function getDefaultRoute(role: string, isHost: boolean): string {
    if (isHost && SUPER_ADMIN_ROLES.includes(role)) {
        return "/admin/dashboard";
    }
    if (COMPANY_ADMIN_ROLES.includes(role)) {
        return "/companies/dashboard";
    }
    if (role === "EMPLOYE") {
        return "/employes/dashboard";
    }
    if (role === "PARTNER_ADMIN" || role === "PARTNER_STAFF") {
        return "/partner-portal/dashboard";
    }
    return "/hub";
}
