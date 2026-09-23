// import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// const api = axios.create({
//     baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
//     headers: { "Content-Type": "application/json" },
//     withCredentials: true,
// });

// // ── Intercepteur requête : ajoute le token automatiquement ──
// api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
//     // Lecture depuis localStorage (côté client uniquement)
//     if (typeof window !== "undefined") {
//         const token = localStorage.getItem("accessToken");
//         if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//         }
//     }
//     return config;
// });

// // ── Intercepteur réponse : gère le refresh token automatique ──
// api.interceptors.response.use(
//     (response) => response,
//     async (error: AxiosError) => {
//         const original = error.config as InternalAxiosRequestConfig & {
//         _retry?: boolean;
//         };

//         // Si 401 et pas déjà retried → tente le refresh
//         if (error.response?.status === 401 && !original._retry) {
//         original._retry = true;

//         try {
//             const refreshToken = localStorage.getItem("refreshToken");
//             if (!refreshToken) throw new Error("Pas de refresh token");

//             const { data } = await axios.post(
//             `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
//             { refreshToken }
//             );

//             localStorage.setItem("accessToken", data.accessToken);
//             original.headers.Authorization = `Bearer ${data.accessToken}`;

//             // Relance la requête originale avec le nouveau token
//             return api(original);
//         } catch {
//             // Refresh échoué → déconnexion
//             localStorage.removeItem("accessToken");
//             localStorage.removeItem("refreshToken");
//             window.location.href = "/login";
//         }
//         }

//         return Promise.reject(error);
//     }
// );

// export default api;








import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { splitLocalePath } from "@/i18n/locale-path";

/**
 * Axios instance — tokens gérés uniquement via cookies HTTP-only.
 * withCredentials: true  → le navigateur envoie automatiquement
 * les cookies (accessToken + refreshToken) à chaque requête.
 * Aucune lecture/écriture de localStorage pour les tokens.
 */
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
    headers: { "Content-Type": "application/json" },
    withCredentials: true, // ← envoie les cookies HTTP-only automatiquement
    timeout: 15000, // évite qu'une requête bloquée laisse l'UI en chargement indéfiniment
});

// ── CSRF (double-submit cookie) ──────────────────────────────────────
// Le backend pose un cookie `csrfToken` non-httpOnly à la connexion (voir
// core/utils/auth-cookies.ts) : on le relit ici et on le renvoie dans un
// en-tête custom sur chaque requête d'écriture, vérifié côté serveur par
// csrfProtection. Nécessaire car les cookies de session sont en
// SameSite=None en production (frontend/backend sur des domaines différents),
// ce qui désactive la protection CSRF native de SameSite=Lax/Strict.
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

export function getCsrfToken(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// ── Intercepteur requête ────────────────────────────────────────────
// Plus besoin d'injecter manuellement le Bearer token :
// le cookie accessToken HTTP-only est transmis par le navigateur.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const method = config.method?.toLowerCase();
    if (method && MUTATING_METHODS.has(method)) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            config.headers.set("X-CSRF-Token", csrfToken);
        }
    }
    return config;
});

// ── Intercepteur réponse : refresh automatique ──────────────────────
// Deux sessions cookie totalement indépendantes coexistent :
//  - User standard   : accessToken/refreshToken       → POST /auth/refresh
//  - Partenaire      : partnerAccessToken/partnerRefreshToken → POST /partner-portal/refresh
// On choisit l'endpoint de refresh selon le chemin de la requête d'origine, jamais
// les deux, pour ne pas mélanger les deux systèmes de session sur un même onglet.
function isPartnerRequest(url?: string): boolean {
    if (!url) return false;
    return url.startsWith("/partner-portal") || url.startsWith("/bookings/partner");
}

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        };

        if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        const isPartner = isPartnerRequest(original.url);
        const refreshPath = isPartner ? "/partner-portal/refresh" : "/auth/refresh";

        try {
            // Le refresh token est dans le cookie HTTP-only correspondant → withCredentials
            // suffit pour le token lui-même, mais /auth/refresh reste une requête POST
            // authentifiée par cookie : le en-tête CSRF est requis (voir csrfProtection).
            // Appel en axios brut (pas l'instance `api`) pour éviter toute boucle de retry
            // sur ce endpoint — l'en-tête doit donc être ajouté manuellement ici.
            const csrfToken = getCsrfToken();
            await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}${refreshPath}`,
            {},
            {
                withCredentials: true,
                headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
            }
            );
            // Le backend renvoie un nouveau cookie access token HTTP-only.
            // On relance simplement la requête originale.
            return api(original);
        } catch {
            // Refresh échoué → déconnexion, chacune vers sa propre page de login
            if (typeof window !== "undefined") {
            const { path } = splitLocalePath(window.location.pathname);

            if (path.startsWith("/partner-portal")) {
                if (path !== "/partner-portal/login") {
                window.location.href = "/partner-portal/login";
                }
            } else {
                const isPublicPage = [
                "/login",
                "/register",
                "/forgot-password",
                "/reset-password",
                "/activate",
                "/infos",
                "/unauthorized",
                ].some((prefix) => path === prefix || path.startsWith(prefix + "/"));
                if (!isPublicPage) {
                window.location.href = "/login";
                }
            }
            }
        }
        }
        return Promise.reject(error);
    }
);

export default api;
