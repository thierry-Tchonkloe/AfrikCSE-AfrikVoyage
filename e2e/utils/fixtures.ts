import fs from "node:fs";
import { FIXTURES_PATH } from "../global-setup";
import type { E2EFixtures } from "../fixtures/seed";

/** Relit les fixtures écrites par global-setup.ts — un seul jeu de données pour toute la suite. */
export function readFixtures(): E2EFixtures {
    if (!fs.existsSync(FIXTURES_PATH)) {
        throw new Error("Fixtures E2E introuvables — global-setup.ts a-t-il bien tourné ?");
    }
    return JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf-8")) as E2EFixtures;
}
