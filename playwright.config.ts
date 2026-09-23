import { defineConfig, devices } from "@playwright/test";

/**
 * Cible par défaut : notre stack de développement local (frontend Next.js :3000,
 * backend Express :5000, la même paire d'URLs que frontend/.env.local). Les deux
 * variables d'env ci-dessous permettent de pointer vers une autre paire de ports
 * (ex: une instance isolée) sans toucher ce fichier.
 */
const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const API_URL  = process.env.E2E_API_URL  || "http://localhost:5000/api";

export default defineConfig({
    testDir: "./e2e",
    outputDir: "./e2e/.test-results",
    fullyParallel: false, // les 2 specs partagent les mêmes fixtures/organisation E2E — pas d'exécution concurrente
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [["html", { outputFolder: "./e2e/.report", open: "never" }], ["list"]],

    globalSetup:    require.resolve("./e2e/global-setup"),
    globalTeardown: require.resolve("./e2e/global-teardown"),

    use: {
        baseURL: BASE_URL,
        // Les specs ciblent l'UI française : sans ça, Chromium envoie Accept-Language
        // en-US et le middleware i18n redirige /login vers /en/login.
        locale: "fr-FR",
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },

    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ],

    // Démarre automatiquement les deux serveurs de dev s'ils ne tournent pas déjà
    // (reuseExistingServer: si le développeur a déjà `npm run dev` ouvert dans
    // backend/ et frontend/, Playwright les réutilise tels quels au lieu d'en
    // relancer une 2e paire en conflit de port).
    webServer: [
        {
            command: "npm run dev",
            cwd: "./backend",
            url: API_URL.replace(/\/api$/, "/health"),
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
            // RATELIMIT_MAX (pas NODE_ENV=test) : élève le plafond du limiteur
            // anti-bruteforce de /auth/login (voir auth.routes.ts) sans désactiver
            // au passage la protection CSRF, elle-même court-circuitée en NODE_ENV
            // "test" — la suite doit continuer à exercer le vrai flux CSRF.
            // N'a d'effet que si Playwright démarre lui-même ce serveur ; si
            // reuseExistingServer réutilise un serveur déjà lancé par le
            // développeur, cette variable ne le rejoint pas rétroactivement.
            env: { PORT: new URL(API_URL).port || "5000", RATELIMIT_MAX: "1000" },
        },
        {
            command: "npm run dev",
            cwd: "./frontend",
            url: BASE_URL,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
            env: {
                PORT: new URL(BASE_URL).port || "3000",
                NEXT_PUBLIC_API_URL: API_URL,
            },
        },
    ],
});
