import axios from "axios";

/**
 * Extrait un message d'erreur lisible depuis une erreur API (Axios).
 * Distingue le message renvoyé par le backend, les erreurs réseau/timeout
 * (backend inaccessible), et retombe sur `fallback` dans les autres cas.
 */
export function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        if (err.response?.data?.message) return err.response.data.message;
        if (err.code === "ECONNABORTED") return "La requête a expiré. Veuillez réessayer.";
        if (!err.response) return "Impossible de contacter le serveur. Vérifiez votre connexion.";
    }
    return fallback;
}
