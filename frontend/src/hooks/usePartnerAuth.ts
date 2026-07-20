"use client";

import { useState, useEffect, useCallback } from "react";
import { PartnerSessionUser } from "@/types";
import { partnerAuthService } from "@/services/partner/partner-portal.service";

/**
 * Session partenaire — entièrement séparée de `useAuth()` (comptes User).
 * L'état vient toujours du backend (cookies HTTP-only partnerAccessToken/
 * partnerRefreshToken, illisibles en JS) via GET /partner-portal/me.
 */
export function usePartnerAuth() {
    const [user, setUser]       = useState<PartnerSessionUser | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            const { user: sessionUser } = await partnerAuthService.getMe();
            setUser(sessionUser);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const logout = useCallback(async () => {
        try {
            await partnerAuthService.logout();
        } finally {
            setUser(null);
            window.location.href = "/partner-portal/login";
        }
    }, []);

    const setSession = useCallback((sessionUser: PartnerSessionUser) => {
        setUser(sessionUser);
    }, []);

    return { user, loading, logout, setSession, reload: loadUser };
}
