import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let initialized = false;

/** Construit (une seule fois) le transporter SMTP à partir des variables d'env */
function getTransporter(): Transporter | null {
    if (initialized) return transporter;
    initialized = true;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        return null;
    }

    transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    return transporter;
}

export interface MailOptions {
    to: string | string[];
    subject: string;
    html: string;
}

/**
 * Envoie un email via SMTP.
 * Si SMTP n'est pas configuré (variables .env vides) ou en cas d'erreur d'envoi,
 * la fonction ne lève jamais d'exception : elle journalise et continue, pour ne
 * jamais bloquer le flux métier appelant (inscription, validation, etc.).
 */
export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
    const t = getTransporter();

    if (!t) {
        if (process.env.NODE_ENV !== "production") {
            console.log(`[DEV] Email non envoyé (SMTP non configuré) — à: ${to}, sujet: "${subject}"`);
        }
        return;
    }

    const fromName = process.env.MAIL_FROM_NAME || "AfrikCSE & AfrikVoyage";
    const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;

    try {
        await t.sendMail({ from: `"${fromName}" <${fromEmail}>`, to, subject, html });
    } catch (err: any) {
        console.error("[MAILER] Échec de l'envoi de l'email :", err.message);
    }
}
