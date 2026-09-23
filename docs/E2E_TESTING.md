# Tests End-to-End (Playwright)

Suite E2E verrouillant les parcours critiques d'AfrikVoyage : cycle de vie
d'une note de frais (soumission employé → approbation manager → remboursement
réel) et cycle de reversement du Portail Partenaire. Fichiers dans [`e2e/`](../e2e/),
configuration dans [`playwright.config.ts`](../playwright.config.ts) à la racine.

## Installation

À la racine du repo (le dossier `e2e/` a son propre `package.json`, indépendant
de `backend/` et `frontend/`) :

```bash
npm install
npx playwright install chromium
```

## Lancer la suite

```bash
npx playwright test
```

Playwright démarre automatiquement le backend (`:5000`) et le frontend
(`:3000`) via `npm run dev` dans chaque dossier s'ils ne tournent pas déjà
(sinon il réutilise ceux déjà lancés). Pas besoin de préparer de données : un
`global-setup` crée une organisation/employé/manager/partenaire dédiés
(préfixés `e2e-*`), qu'un `global-teardown` supprime intégralement à la fin —
aucune donnée réelle ou seedée pour la démo (`admin@afrikvoyage.com` etc.)
n'est jamais touchée.

Autres commandes utiles :

```bash
npx playwright test --ui        # mode interactif (debug pas à pas)
npx playwright show-report      # dernier rapport HTML (e2e/.report)
```

Pour cibler une autre paire de ports (ex: une instance isolée) :

```bash
E2E_BASE_URL=http://localhost:3100 E2E_API_URL=http://localhost:5001/api npx playwright test
```

## Point d'attention : simulation de l'upload Cloudinary

L'upload de justificatif (`POST /employee/expenses/upload`) signe la requête
Cloudinary avec l'horloge système. Sur certains environnements d'exécution
(horloge désynchronisée de celle des serveurs Cloudinary), Cloudinary rejette
la requête avec `"Stale request"` — un problème d'horloge, pas un bug du code
(vérifié en isolant l'appel hors Playwright).

`e2e/travel-expense-flow.spec.ts` intercepte donc **ce seul appel réseau**
(`page.route("**/api/employee/expenses/upload", ...)`) pour simuler une
réponse Cloudinary réussie. Tout le reste du flux — scan OCR, soumission,
approbation manager, débit/crédit des wallets — s'exécute réellement, sans
mock. Si l'horloge de votre environnement est correcte, ce mock est inutile
mais inoffensif ; vous pouvez le retirer pour exercer le vrai chemin Cloudinary.

## Anti-bruteforce (`/auth/login`)

Le test se connecte plusieurs fois (employé, manager, partenaire). Le
limiteur anti-bruteforce de `/auth/login` (5 tentatives/15 min en usage
normal) est automatiquement élevé quand Playwright démarre lui-même le
serveur backend (`RATELIMIT_MAX=1000` injecté par `playwright.config.ts`) —
sans passer par `NODE_ENV=test`, pour que la suite continue d'exercer la
vraie protection CSRF (court-circuitée en `NODE_ENV=test`).

Si vous lancez la suite contre un serveur backend que **vous** avez démarré
vous-même (`reuseExistingServer`), pensez à l'exporter manuellement :

```bash
RATELIMIT_MAX=1000 npm run dev   # dans backend/
```
