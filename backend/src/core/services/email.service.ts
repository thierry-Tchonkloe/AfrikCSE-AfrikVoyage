import { Resend } from "resend";
import { logger } from "../utils/logger";

let client: Resend | null = null;
let initialized = false;

/** Construit (une seule fois) le client Resend à partir des variables d'env */
function getClient(): Resend | null {
    if (initialized) return client;
    initialized = true;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;

    client = new Resend(apiKey);
    return client;
}

export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

/**
 * Envoie un email via Resend.
 * Si RESEND_API_KEY ou EMAIL_FROM ne sont pas configurés, ou en cas d'erreur
 * d'envoi, la fonction ne lève jamais d'exception : elle journalise et continue,
 * pour ne jamais bloquer le flux métier appelant (inscription, validation, etc.).
 */
export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
    const resend = getClient();
    const fromEmail = process.env.EMAIL_FROM;
    const fromName = process.env.MAIL_FROM_NAME || "AfrikCSE & AfrikVoyage";

    if (!resend || !fromEmail) {
        if (process.env.NODE_ENV !== "production") {
            logger.debug(`Email non envoyé (Resend non configuré) — à: ${to}, sujet: "${subject}"`);
        }
        return;
    }

    try {
        const { error } = await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to,
            subject,
            html,
        });
        if (error) {
            logger.error({ err: error }, "Échec de l'envoi d'email via Resend");
        }
    } catch (err: any) {
        logger.error({ err }, "Échec de l'envoi d'email via Resend");
    }
}
