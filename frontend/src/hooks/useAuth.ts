// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { User } from "@/types";
// import api from "@/lib/api";

// // ── Helpers cookie ────────────────────────────────────────
// function setCookie(name: string, value: string, days = 7) {
//     const expires = new Date(Date.now() + days * 864e5).toUTCString();
//     document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
// }

// function deleteCookie(name: string) {
//     document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
// }

// export function useAuth() {
//     const [user, setUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);

//     const loadUser = useCallback(async () => {
//         const token = localStorage.getItem("accessToken");
//         if (!token) {
//         setLoading(false);
//         return;
//         }

//         try {
//         const { data } = await api.get("/auth/me");
//             setUser(data.user);
//         } catch {
//             localStorage.removeItem("accessToken");
//             localStorage.removeItem("refreshToken");
//             deleteCookie("accessToken");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         loadUser();
//     }, [loadUser]);

//     const logout = useCallback(async () => {
//         try {
//             await api.post("/auth/logout");
//         } finally {
//             localStorage.removeItem("accessToken");
//             localStorage.removeItem("refreshToken");
//             deleteCookie("accessToken");
//             setUser(null);
//             window.location.href = "/login";
//         }
//     }, []);

//     const setAuthData = useCallback(
//         (accessToken: string, refreshToken: string, userData: User) => {
//             // localStorage pour les appels API
//             localStorage.setItem("accessToken", accessToken);
//             localStorage.setItem("refreshToken", refreshToken);
//             // Cookie pour le middleware Next.js
//             setCookie("accessToken", accessToken);
//             setUser(userData);
//         },
//         []
//     );

//     return { user, loading, logout, setAuthData, reload: loadUser };
// }




// "use client";

// import { useState, useEffect, useCallback } from "react";
// import { User } from "@/types";
// import api from "@/lib/api";

// // ── Cookie helper amélioré ─────────────────────────────
// function setCookie(name: string, value: string) {
//     document.cookie = `${name}=${value}; path=/; SameSite=Lax`;
// }

// function deleteCookie(name: string) {
//     document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
// }

// export function useAuth() {
//     const [user, setUser] = useState<User | null>(null);
//     const [loading, setLoading] = useState(true);

//     // ── Charger utilisateur ─────────────────────────────
//     const loadUser = useCallback(async () => {
//         try {
//             const { data } = await api.get("/auth/me", {
//                 withCredentials: true, // 🔥 IMPORTANT
//             });
//             setUser(data.user);
//         } catch {
//             deleteCookie("accessToken");
//             localStorage.removeItem("accessToken");
//             localStorage.removeItem("refreshToken");
//         } finally {
//             setLoading(false);
//         }
//     }, []);

//     useEffect(() => {
//         loadUser();
//     }, [loadUser]);

//     // ── Logout ──────────────────────────────────────────
//     const logout = useCallback(async () => {
//         try {
//             await api.post("/auth/logout", {}, { withCredentials: true });
//         } finally {
//             deleteCookie("accessToken");
//             localStorage.clear();
//             setUser(null);
//             window.location.href = "/login";
//         }
//     }, []);

//     // ── Login ───────────────────────────────────────────
//     const setAuthData = useCallback(
//         (accessToken: string, refreshToken: string, userData: User) => {
//             // OPTION TEMPORAIRE (dev uniquement)
//             localStorage.setItem("accessToken", accessToken);
//             localStorage.setItem("refreshToken", refreshToken);

//             // 🔥 CRUCIAL pour middleware
//             setCookie("accessToken", accessToken);

//             setUser(userData);

//             // 🔥 FORCE reload pour que middleware voit le cookie
//             window.location.href = "/";
//         },
//         []
//     );

//     return { user, loading, logout, setAuthData, reload: loadUser };
// }





"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@/types";
import api from "@/lib/api";

// ── Helpers cookie ─────────────────────────────────────────
// function setCookie(name: string, value: string, days = 1) {
//   if (typeof document === "undefined") return;

//   const expires = new Date();
//   expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

//   const isSecure = window.location.protocol === "https:";

//   document.cookie = [
//     `${name}=${value}`,
//     `expires=${expires.toUTCString()}`,
//     "path=/",
//     "SameSite=Lax",
//     isSecure ? "Secure" : "",
//   ]
//     .filter(Boolean)
//     .join("; ");
// }

// function deleteCookie(name: string) {
//   if (typeof document === "undefined") return;
//   document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
// }


// ── Helpers cookie ─────────────────────────────────────────
function setCookie(name: string, value: string, days = 1) {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const isSecure = window.location.protocol === "https:";

  document.cookie = [
    `${name}=${value}`,
    `expires=${expires.toUTCString()}`,
    "path=/",
    // "SameSite=None" est OBLIGATOIRE pour l'échange de cookies Vercel <-> Render en ligne
    isSecure ? "SameSite=None" : "SameSite=Lax",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  const isSecure = window.location.protocol === "https:";
  
  // La suppression doit calquer les mêmes attributs SameSite pour être valide en ligne
  document.cookie = [
    `${name}=`,
    "expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "path=/",
    isSecure ? "SameSite=None" : "SameSite=Lax",
    isSecure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}


export function useAuth() {
  const [user, setUser]       = useState<User | null>(null);
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

  /**
   * Stocke le token + cookie.
   * NE fait PAS de redirection — c'est la responsabilité
   * de la page qui appelle setAuthData (login/page.tsx)
   */
  const setAuthData = useCallback(
    (accessToken: string, refreshToken: string, userData: User) => {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setCookie("accessToken", accessToken, 1);
      setUser(userData);
      // PAS de window.location.href ici
    },
    []
  );

  return { user, loading, logout, setAuthData, reload: loadUser };
}