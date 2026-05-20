import "dotenv/config";
import app from "./app";

const PORT = process.env.PORT || 5000;

// Vérifie les variables critiques au démarrage
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
    console.error(
        `[FATAL] Variables d'environnement manquantes : ${missingVars.join(", ")}`
    );
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log(`[ENV] ${process.env.NODE_ENV}`);
    console.log(`[DB] Connected to ${process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "unknown"}`);
});

// Gestion propre des erreurs non catchées
process.on("unhandledRejection", (reason) => {
    console.error("[UNHANDLED REJECTION]", reason);
    process.exit(1);
});

process.on("uncaughtException", (error) => {
    console.error("[UNCAUGHT EXCEPTION]", error);
    process.exit(1);
});