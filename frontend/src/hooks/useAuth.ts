"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import api from "@/lib/api";

// ── Helpers cookie ────────────────────────────────────────
function setCookie(name: string, value: string, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
        setLoading(false);
        return;
        }

        try {
        const { data } = await api.get("/auth/me");
            setUser(data.user);
        } catch {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            deleteCookie("accessToken");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            deleteCookie("accessToken");
            setUser(null);
            window.location.href = "/login";
        }
    }, []);

    const setAuthData = useCallback(
        (accessToken: string, refreshToken: string, userData: User) => {
            // localStorage pour les appels API
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            // Cookie pour le middleware Next.js
            setCookie("accessToken", accessToken);
            setUser(userData);
        },
        []
    );

    return { user, loading, logout, setAuthData, reload: loadUser };
}