import fs from "node:fs";
import { teardownE2EFixtures, E2EFixtures } from "./fixtures/seed";
import { FIXTURES_PATH } from "./global-setup";

/**
 * Exécuté une seule fois après l'ensemble de la suite (succès ou échec —
 * Playwright appelle toujours globalTeardown si globalSetup a réussi).
 * Supprime tout ce que global-setup a créé, jamais les données réelles.
 */
export default async function globalTeardown(): Promise<void> {
    if (!fs.existsSync(FIXTURES_PATH)) return; // globalSetup a échoué avant d'écrire le fichier

    const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf-8")) as E2EFixtures;
    await teardownE2EFixtures(fixtures);
    fs.rmSync(FIXTURES_PATH, { force: true });
    console.log(`[e2e/global-teardown] Fixtures nettoyées (runId=${fixtures.runId})`);
}
