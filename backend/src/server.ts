import "dotenv/config";
import app from "./app";
import { logger } from "./core/utils/logger";
import { startEventReminderJob } from "./modules/events/application/event-reminder.job";
import { startTripReminderJob } from "./modules/travels/application/travel-reminder.job";

const PORT = process.env.PORT || 5000;

// Vérifie les variables critiques au démarrage
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
    logger.fatal(
        `Variables d'environnement manquantes : ${missingVars.join(", ")}`
    );
    process.exit(1);
}

app.listen(PORT, () => {
    logger.info(`Running on port ${PORT}`);
    logger.info(`Environnement : ${process.env.NODE_ENV}`);
    logger.info(`Connecté à la base : ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown"}`);
});

startEventReminderJob();
startTripReminderJob();

// Gestion propre des erreurs non catchées
process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "Unhandled rejection");
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "Uncaught exception");
    process.exit(1);
});