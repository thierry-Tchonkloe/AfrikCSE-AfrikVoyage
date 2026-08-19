# AfrikCSE & AfrikVoyage

Plateforme SaaS multi-tenant pour la gestion des avantages salariés (CSE) et des voyages d'affaires en Afrique. Le produit combine un catalogue d'avantages CSE (billetterie, offres partenaires, cashback, wallet employé) avec un module de gestion des voyages professionnels façon Navan (politiques de voyage, réservations, voyages de groupe, notes de frais avec OCR).

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts utiles](#scripts-utiles)
- [Rôles & accès](#rôles--accès)
- [Paiements](#paiements)
- [Documentation complémentaire](#documentation-complémentaire)
- [Déploiement](#déploiement)

## Aperçu

Le produit s'adresse à trois publics :

- **Entreprises clientes** (espace `companies/`) — administrent leur CSE (AfrikCSE) et/ou leur programme de voyages (AfrikVoyage) : catalogue, budgets, notes de frais, politiques de voyage, reporting.
- **Employés** (espace `employes/`) — consultent le catalogue d'avantages, réservent des offres/voyages, gèrent leur wallet, leur famille, leurs tickets QR et leur carte de membre.
- **Super Admin Waxeho** (espace `admin/`) — pilote la plateforme multi-tenant : organisations, partenaires, plans commerciaux, commissions, service client, API développeur.

Un quatrième espace, le **portail partenaire** (`partner-portal/`), permet aux marchands partenaires de gérer leurs offres, disponibilités et réservations avec leur propre authentification.

## Stack technique

| Couche | Techno |
|---|---|
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Base de données | PostgreSQL |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Style | TailwindCSS v4 |
| Auth | JWT en cookies HTTP-only (access + refresh) |
| Validation | Zod (backend), react-hook-form + Zod (frontend) |
| Uploads | Cloudinary |
| Emails | Resend |
| Paiements | KkiaPay, FedaPay (Mobile Money & carte, Afrique de l'Ouest) |
| i18n | next-intl (FR/EN) |
| Tests | Jest + Supertest (backend) |

## Architecture

Le repo est un monorepo à deux applications :

```
├── backend/     # API Express (voir backend/API_DOCUMENTATION.md)
└── frontend/    # Application Next.js
```

### Backend — `backend/src/modules/`

Chaque module suit le pattern **application / infrastructure / interfaces** :
- `application/` — logique métier (service)
- `infrastructure/` — accès données (repository, Prisma)
- `interfaces/` — HTTP (controller, routes, validators Zod)

Modules principaux : `auth`, `organization`, `user`, `employee(s)`, `benefits`, `catalog`, `travels`, `travel-policies`, `group-travel`, `travel-rewards`, `billing`, `wallet`, `cashback`, `orders`, `bookings`, `commissions`, `partners`, `partner-portal`, `messaging`, `communication`, `events`, `event-photos`, `family-members`, `tickets`, `faq`, `subsidy-rules`, `notification`, `reporting`, `api-developer`, `country-config`, `plan-config`, `ocr`, `flights`, `hotels`, `car-rentals`, `trains`, `search`, `contact`, `settings`, `audit-log`, `integrations`.

### Frontend — `frontend/src/app/`

Organisé en groupes de routes Next.js (App Router) par espace :
- `(auth)/` — login, register, mot de passe oublié, activation de compte
- `(company-space)/companies/` — espace entreprise (ADMIN/MANAGER/RH/FINANCE)
- `(employes-space)/employes/` — espace employé personnel
- `(super-admin-space)/admin/` — dashboard Super Admin Waxeho
- `(partner-portal)/partner-portal/` — espace partenaire/marchand
- `(infos-pages-space)/infos/` — pages publiques vitrine (accueil, tarifs, à propos, contact…)

Services HTTP dans `src/services/` (par espace) consomment l'API via une instance Axios (`lib/api.ts`) avec `withCredentials: true` et rafraîchissement automatique du token sur 401.

## Démarrage rapide

### Prérequis

- Node.js 18+
- PostgreSQL (ou Docker)

### Option A — Docker (développement local)

```bash
cp backend/.env.example backend/.env   # puis renseigner les secrets
docker compose up --build
```

Démarre `postgres`, `backend` (port 5000) et `frontend` (port 3000).

> La production ne passe pas par ce docker-compose : elle utilise Render (backend) + Vercel (frontend). Voir [DEPLOYMENT.md](DEPLOYMENT.md).

### Option B — Manuel

**Backend**

```bash
cd backend
npm install
cp .env.example .env       # renseigner les variables (voir plus bas)
npx prisma migrate dev
npx prisma generate
npm run dev                 # http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev                 # http://localhost:3000
```

Le frontend attend `NEXT_PUBLIC_API_URL` (ex. `http://localhost:5000/api`).

## Variables d'environnement

Le détail complet et commenté est dans [backend/.env.example](backend/.env.example). Principales catégories :

- **Serveur** : `NODE_ENV`, `PORT`, `DATABASE_URL`
- **Auth** : `JWT_SECRET` (signe access + refresh tokens, identique frontend/backend), `SESSION_COOKIE_SECRET`
- **CORS** : `FRONTEND_URL`
- **Chiffrement** : `ENCRYPTION_KEY` (AES-256-GCM, clés API partenaires), `TICKET_SECRET` (HMAC-SHA256, QR tickets)
- **Uploads** : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Vols** : `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`, `AMADEUS_BASE_URL` (fallback si intégration non configurée en BDD)
- **Email** : `RESEND_API_KEY`, `EMAIL_FROM`, `MAIL_FROM_NAME`, `SUPPORT_EMAIL`, `SUPER_ADMIN_NOTIFICATION_EMAIL`
- **Paiements** : `KKIAPAY_PUBLIC_KEY` / `KKIAPAY_PRIVATE_KEY` / `KKIAPAY_SECRET_KEY`, `FEDAPAY_SECRET_KEY`, `FEDAPAY_WEBHOOK_TOKEN`, `BACKEND_URL` (callbacks webhook)
- **OCR** (notes de frais) : `OCR_PROVIDER`, `OCR_API_KEY`, `MINDEE_DOCUMENT_TYPE`
- **PDF** (carte de membre) : `PUPPETEER_EXECUTABLE_PATH` (optionnel, sinon `pdfkit`)

Côté frontend : `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY`, `JWT_SECRET` (même valeur que le backend, utilisée par le middleware Next.js).

⚠️ Ne jamais committer `.env`.

## Scripts utiles

**Backend** (`backend/`)

```bash
npm run dev              # serveur dev avec rechargement
npm run build            # compilation TypeScript
npm run prisma:migrate   # nouvelle migration + application
npm run prisma:deploy    # applique les migrations (prod)
npm run prisma:studio    # GUI base de données
npm run prisma:seed      # seed initial
npm run db:reset         # reset complet de la BDD
npm test                 # tests Jest
```

**Frontend** (`frontend/`)

```bash
npm run dev     # serveur dev Next.js
npm run build   # build production
npm run start   # lancer le build
npm run lint    # ESLint
```

## Rôles & accès

Hiérarchie RBAC : `SUPER_ADMIN` (Waxeho, `isHost=true`) → `ADMIN` → `MANAGER` → `RH` / `FINANCE` → `EMPLOYE`, avec deux rôles isolés côté marketplace : `PARTNER_ADMIN` → `PARTNER_STAFF`.

## Paiements

Deux passerelles adaptées au marché africain (Mobile Money + carte) :

- **KkiaPay** — widget frontend, vérification serveur systématique de la transaction avant activation d'un abonnement.
- **FedaPay** — création de transaction backend, redirection checkout, activation via webhook signé (`x-fedapay-webhook-token`).

Les routes webhook sont publiques et déclarées avant le middleware d'authentification. Détails des flows dans `backend/API_DOCUMENTATION.md`.

## Documentation complémentaire

| Fichier | Contenu |
|---|---|
| [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md) | Référence complète des endpoints API |
| [backend/README.md](backend/README.md) | Setup Prisma/backend détaillé |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Configuration production (Render + Vercel), variables, correctifs cross-origin |
| [SPECS_FONCTIONNELLES_V3.md](SPECS_FONCTIONNELLES_V3.md) | Spécifications fonctionnelles détaillées (dernière version) |
| [Dossier_AfrikCSE_Business_Model_Cahier_des_Charges.md](Dossier_AfrikCSE_Business_Model_Cahier_des_Charges.md) | Business model & cahier des charges |

## Déploiement

- **Backend** : Render (voir `backend/render.yaml`)
- **Frontend** : Vercel, avec un rewrite `/api/*` vers le backend Render pour que les cookies HTTP-only fonctionnent en cross-origin
- **CI/CD** : `.github/workflows/`

Voir [DEPLOYMENT.md](DEPLOYMENT.md) pour la checklist complète de mise en production (secrets, cookies cross-origin, JWT partagé).
