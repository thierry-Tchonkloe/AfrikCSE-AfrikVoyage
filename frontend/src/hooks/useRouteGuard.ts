"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Role } from "@/types";

type SpaceType = "super-admin" | "company" | "employee";

const SPACE_RULES: Record<SpaceType, (role: Role, isHost: boolean) => boolean> = {
    // Super admin : uniquement Waxeho + rôle élevé
    "super-admin": (role, isHost) =>
        isHost && ["SUPER_ADMIN", "MANAGER"].includes(role),

    // Company : admins de toute org
    "company": (role) =>
        ["ADMIN", "MANAGER", "RH", "FINANCE"].includes(role),

    // Employé : tout le monde
    "employee": () => true,
};

const SPACE_REDIRECTS: Record<SpaceType, string> = {
    "super-admin": "/admin/dashboard",
    "company":     "/companies/dashboard",
    "employee":    "/employes/dashboard",
};

/**
 * Hook de protection de route côté client
 * À utiliser dans chaque layout d'espace
 *
 * @param space - L'espace à protéger
 */
export function useRouteGuard(space: SpaceType) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // Pas connecté → login
        if (!user) {
        router.push("/login");
        return;
        }

        const isHost = (user.organization as any)?.isHost ?? false;
        const canAccess = SPACE_RULES[space](user.role as Role, isHost);

        if (!canAccess) {
        // Redirige vers l'espace approprié
        if (isHost && ["SUPER_ADMIN", "MANAGER"].includes(user.role)) {
            router.push(SPACE_REDIRECTS["super-admin"]);
        } else if (["ADMIN", "MANAGER", "RH", "FINANCE"].includes(user.role)) {
            router.push(SPACE_REDIRECTS["company"]);
        } else {
            router.push(SPACE_REDIRECTS["employee"]);
        }
        }
    }, [user, loading, space, router]);

    return { user, loading };
}