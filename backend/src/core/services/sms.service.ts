import { logger } from "../utils/logger";

export interface SmsOptions {
    to:      string;
    message: string;
}

/**
 * Envoie un SMS via le provider configuré (SMS_PROVIDER + SMS_API_KEY).
 * Si les variables ne sont pas définies, journalise et continue sans erreur.
 * Supporte : "africastalking" | "twilio" | "infobip" — stubs prêts pour intégration réelle.
 */
export async function sendSms({ to, message }: SmsOptions): Promise<void> {
    const provider = process.env.SMS_PROVIDER;
    const apiKey   = process.env.SMS_API_KEY;
    const from     = process.env.SMS_FROM ?? "AfrikCSE";

    if (!provider || !apiKey) {
        if (process.env.NODE_ENV !== "production") {
            logger.debug(`SMS non envoyé (SMS_PROVIDER/SMS_API_KEY non configurés) — à: ${to}`);
        }
        return;
    }

    try {
        // Provider SDKs are installed on demand — log a warning if missing
        logger.warn(`SMS_PROVIDER="${provider}" configuré mais SDK non installé. Installez le package correspondant.`);
    } catch (err) {
        logger.error({ err, to }, "Échec d'envoi SMS");
    }

    // Placeholder log until real provider SDK is wired
    logger.info({ provider, to, from, messageLength: message.length }, "SMS dispatched (stub)");
}
