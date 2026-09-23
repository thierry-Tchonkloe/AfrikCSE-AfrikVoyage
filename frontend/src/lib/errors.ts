import axios from "axios";

const NETWORK_MESSAGES = {
    fr: {
        timeout: "La requête a expiré. Veuillez réessayer.",
        unreachable: "Impossible de contacter le serveur. Vérifiez votre connexion.",
    },
    en: {
        timeout: "The request timed out. Please try again.",
        unreachable: "Unable to reach the server. Check your connection.",
    },
} as const;

// Fonction utilitaire hors React : la langue est lue sur <html lang> (posé par [locale]/layout.tsx).
function currentLang(): keyof typeof NETWORK_MESSAGES {
    return typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "fr";
}

/**
 * Extrait un message d'erreur lisible depuis une erreur API (Axios).
 * Distingue le message renvoyé par le backend, les erreurs réseau/timeout
 * (backend inaccessible), et retombe sur `fallback` dans les autres cas.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) return err.response.data.message;
        if (err.code === "ECONNABORTED") return NETWORK_MESSAGES[currentLang()].timeout;
        if (!err.response) return NETWORK_MESSAGES[currentLang()].unreachable;
    }
    return fallback;
}
