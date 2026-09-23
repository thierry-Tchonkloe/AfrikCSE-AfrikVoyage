import fs from "node:fs";
import path from "node:path";
import { seedE2EFixtures } from "./fixtures/seed";

export const FIXTURES_PATH = path.resolve(__dirname, ".auth/fixtures.json");

/**
 * Exécuté une seule fois avant l'ensemble de la suite (voir playwright.config.ts).
 * Les fixtures sont écrites sur disque car globalSetup tourne dans un process
 * Node séparé des workers qui exécutent les specs — impossible de partager un
 * simple objet en mémoire entre les deux.
 */
export default async function globalSetup(): Promise<void> {
    const fixtures = await seedE2EFixtures();
    fs.mkdirSync(path.dirname(FIXTURES_PATH), { recursive: true });
    fs.writeFileSync(FIXTURES_PATH, JSON.stringify(fixtures, null, 2));
    console.log(`[e2e/global-setup] Fixtures créées (runId=${fixtures.runId}) → ${FIXTURES_PATH}`);
}
