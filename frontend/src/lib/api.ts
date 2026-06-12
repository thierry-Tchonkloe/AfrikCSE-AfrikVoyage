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

// ── Intercepteur requête ────────────────────────────────────────────
// Plus besoin d'injecter manuellement le Bearer token :
// le cookie accessToken HTTP-only est transmis par le navigateur.
// On garde l'intercepteur vide pour d'éventuels headers custom.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    return config;
});

// ── Intercepteur réponse : refresh automatique ──────────────────────
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const original = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        };

        // 401 → tentative de refresh via cookie refreshToken HTTP-only
        if (error.response?.status === 401 && !original._retry) {
        original._retry = true;
        try {
            // Le refreshToken est dans le cookie HTTP-only → withCredentials suffit
            await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            {},
            { withCredentials: true }
            );
            // Le backend renvoie un nouveau cookie accessToken HTTP-only.
            // On relance simplement la requête originale.
            return api(original);
        } catch {
            // Refresh échoué → déconnexion
            if (typeof window !== "undefined") {
            const path = window.location.pathname;
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
        return Promise.reject(error);
    }
);

export default api;
