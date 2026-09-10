#!/usr/bin/env node
/**
 * Vérifie qu'une clé API générée depuis /admin/developer authentifie réellement
 * un appel à l'API publique — sert de test de fumée pour un intégrateur tiers.
 *
 * Usage :
 *   node scripts/test-public-api.js <clé-api> [baseUrl]
 *
 * Variables d'environnement (alternative aux arguments) :
 *   API_KEY   — clé API brute (ak_...), obligatoire
 *   API_BASE_URL — défaut : http://localhost:5000/api
 */

const apiKey = process.argv[2] || process.env.API_KEY;
const baseUrl = process.argv[3] || process.env.API_BASE_URL || "http://localhost:5000/api";

if (!apiKey) {
    console.error("❌ Aucune clé API fournie.");
    console.error("   Usage : node scripts/test-public-api.js <clé-api> [baseUrl]");
    console.error("   ou définissez la variable d'environnement API_KEY.");
    process.exit(1);
}

async function main() {
    const url = `${baseUrl}/v1/public/ping`;
    console.log(`→ GET ${url}`);
    console.log(`→ x-api-key: ${apiKey.slice(0, 12)}${"•".repeat(20)}`);

    let response;
    try {
        response = await fetch(url, {
            method: "GET",
            headers: { "x-api-key": apiKey },
        });
    } catch (err) {
        console.error(`❌ Impossible de contacter le serveur (${baseUrl}) — ${err.message}`);
        process.exit(1);
    }

    const body = await response.json().catch(() => null);

    if (response.status === 200) {
        console.log("✅ Succès — la clé API est valide et active.");
        console.log(`   clientId : ${body?.clientId}`);
        console.log(`   orgId    : ${body?.orgId}`);
        console.log(`   scopes   : ${(body?.scopes ?? []).join(", ") || "(aucun)"}`);
        process.exit(0);
    } else if (response.status === 401) {
        console.error(`❌ Échec (401) — clé API invalide, révoquée ou expirée.`);
        console.error(`   Détail serveur : ${body?.message ?? "(aucun détail)"}`);
        process.exit(1);
    } else {
        console.error(`❌ Échec (${response.status}) — ${body?.message ?? "réponse inattendue"}`);
        process.exit(1);
    }
}

main();
