# Documentation API Backend

## Base URL

Toutes les routes sont exposées sous le préfixe :

- `/api`
- Exemple : `https://your-backend.example.com/api/auth/login`

## Authentification

La plateforme utilise des **cookies HTTP-only** (pas de header Authorization).
- `accessToken` — durée 15 min
- `refreshToken` — durée 7 jours, stocké hashé en base
- Refresh automatique via `POST /api/auth/refresh`

---

## Point de terminaison global

- `GET /health` — Vérifie que le serveur fonctionne
- `GET /api` — Liste les routes disponibles avec documentation intégrée

---

## Authentification (`/api/auth`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| POST | `/api/auth/register-company` | Public | Créer une organisation + admin |
| POST | `/api/auth/login` | Public | Connexion (retourne cookie) |
| POST | `/api/auth/refresh` | Public | Renouveler le token d'accès |
| POST | `/api/auth/forgot-password` | Public | Demande de reset mot de passe |
| POST | `/api/auth/reset-password` | Public | Confirmer le nouveau mot de passe |
| POST | `/api/auth/logout` | Auth | Déconnexion (efface les cookies) |
| GET | `/api/auth/me` | Auth | Profil de l'utilisateur connecté |
| PATCH | `/api/auth/complete-profile` | Auth | Compléter le profil lors de l'activation |
| POST | `/api/auth/activate` | Public | Activer un compte via token invitation |

---

## Organisations (`/api/organizations`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/organizations` | SUPER_ADMIN | Liste toutes les organisations |
| POST | `/api/organizations` | SUPER_ADMIN | Créer une organisation |
| GET | `/api/organizations/paginated` | SUPER_ADMIN | Liste paginée avec filtres |
| GET | `/api/organizations/my/dashboard` | Auth | Dashboard de l'org connectée |
| **PATCH** | **`/api/organizations/my`** | **ADMIN, MANAGER** | **Mettre à jour sa propre organisation** |
| GET | `/api/organizations/:id` | SUPER_ADMIN | Détails d'une organisation |
| PATCH | `/api/organizations/:id/validate` | SUPER_ADMIN | Valider une org en attente |
| PATCH | `/api/organizations/:id/reject` | SUPER_ADMIN | Rejeter une org en attente |
| PATCH | `/api/organizations/:id/modules` | SUPER_ADMIN | Activer/désactiver les modules |
| PATCH | `/api/organizations/:id/suspend` | SUPER_ADMIN | Suspendre une organisation |
| PATCH | `/api/organizations/:id/reactivate` | SUPER_ADMIN | Réactiver une org suspendue |
| PATCH | `/api/organizations/:id/validate-invite` | SUPER_ADMIN | Valider + envoyer lien invitation |
| POST | `/api/organizations/:id/invite` | SUPER_ADMIN | Regénérer un lien d'invitation |
| DELETE | `/api/organizations/:id` | SUPER_ADMIN | Désactiver (soft delete) une org |

### `PATCH /api/organizations/my` — Corps de la requête
```json
{
  "name": "Nouveau nom (optionnel)",
  "businessEmail": "contact@entreprise.com",
  "phone": "+229 97 00 00 00",
  "address": "123 rue de l'Indépendance",
  "city": "Cotonou",
  "country": "Bénin",
  "industry": "Technology & Software",
  "size": "51-200"
}
```

---

## Utilisateurs (`/api/users`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/users` | ADMIN+ | Liste des utilisateurs de l'org |
| GET | `/api/users/:id` | ADMIN+ | Détails d'un utilisateur |
| POST | `/api/users` | ADMIN+ | Créer un utilisateur |
| PATCH | `/api/users/:id` | ADMIN+ | Modifier un utilisateur |
| PATCH | `/api/users/:id/role` | ADMIN+ | Changer le rôle |
| PATCH | `/api/users/:id/deactivate` | ADMIN+ | Désactiver |
| PATCH | `/api/users/:id/activate` | ADMIN+ | Réactiver |

---

## Paramètres plateforme (`/api/settings`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/settings` | SUPER_ADMIN | Lire les paramètres globaux |
| PATCH | `/api/settings` | SUPER_ADMIN | Mettre à jour les paramètres |
| GET | `/api/settings/dashboard` | Auth | Données du dashboard plateforme |

---

## Contact (`/api/contact`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| POST | `/api/contact` | Public | Soumettre un formulaire de contact |
| GET | `/api/contact` | SUPER_ADMIN | Lister les demandes de contact |
| PATCH | `/api/contact/:id/status` | SUPER_ADMIN | Changer le statut d'une demande |

---

## Employés — vue admin (`/api/employees`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/employees` | ADMIN, MANAGER, RH | Liste paginée des employés |
| GET | `/api/employees/stats` | ADMIN, MANAGER, RH | Statistiques employés |
| GET | `/api/employees/:id` | ADMIN, MANAGER, RH | Détails d'un employé |

---

## Avantages CSE — vue admin (`/api/benefits`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/benefits/categories` | ADMIN, MANAGER, RH | Catégories d'avantages de l'org |
| POST | `/api/benefits/categories` | ADMIN | Créer une catégorie |
| PATCH | `/api/benefits/categories/:id` | ADMIN | Modifier une catégorie |
| DELETE | `/api/benefits/categories/:id` | ADMIN | Supprimer une catégorie |
| GET | `/api/benefits/requests` | ADMIN, MANAGER, RH | Demandes d'avantages paginées |
| GET | `/api/benefits/requests/stats` | ADMIN, MANAGER, RH | Statistiques approbations |
| PATCH | `/api/benefits/requests/:id/approve` | ADMIN, MANAGER | Approuver une demande |
| PATCH | `/api/benefits/requests/:id/reject` | ADMIN, MANAGER | Rejeter une demande (note requise) |
| POST | `/api/benefits/requests/bulk-approve` | ADMIN, MANAGER | Approuver en masse |
| GET | `/api/benefits/report` | ADMIN, FINANCE | Rapport budgétaire annuel |

---

## Facturation (`/api/billing`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/billing/plans` | Public | Prix des plans en USD et XOF |
| **POST** | **`/api/billing/webhook/kkiapay`** | **Public (signé HMAC)** | **Webhook KkiaPay** |
| **POST** | **`/api/billing/webhook/fedapay`** | **Public (token header)** | **Webhook FedaPay** |
| GET | `/api/billing` | ADMIN, FINANCE | Abonnement courant + factures |
| POST | `/api/billing/upgrade` | ADMIN, FINANCE | Changer de plan (sans paiement) |
| GET | `/api/billing/invoices` | ADMIN, FINANCE | Historique des factures |
| POST | `/api/billing/pay/kkiapay` | ADMIN, FINANCE | Confirmer transactionId KkiaPay |
| POST | `/api/billing/pay/fedapay` | ADMIN, FINANCE | Créer transaction → checkoutUrl |
| POST | `/api/billing/pay/card` | ADMIN, FINANCE | Paiement carte (Stripe-ready) |

### Variables d'environnement requises pour la facturation
```env
# KkiaPay
KKIAPAY_SECRET_KEY=sk_live_...         # Clé secrète API (vérification transactions)
KKIAPAY_PRIVATE_KEY=pk_live_...        # Clé privée (optionnel)
KKIAPAY_API_URL=https://api.kkiapay.me # (optionnel, défaut ci-contre)

# FedaPay
FEDAPAY_SECRET_KEY=sk_live_...         # Clé secrète API
FEDAPAY_WEBHOOK_TOKEN=your_token_here  # Token de validation webhook
FEDAPAY_API_URL=https://api.fedapay.com # (optionnel, défaut ci-contre)

# Frontend (Next.js)
NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY=pk_live_...  # Clé publique pour le widget
```

### Flow de paiement KkiaPay
```
1. Frontend charge le widget: window.openKkiapayWidget({ amount, api_key })
2. Utilisateur paie → widget appelle onSuccess({ transactionId })
3. Frontend → POST /api/billing/pay/kkiapay { plan, transactionId }
4. Backend vérifie auprès de https://api.kkiapay.me/api/v1/transactions/{id}/status
5. Si SUCCESS → crée abonnement + facture
```

### Flow de paiement FedaPay
```
1. Frontend → POST /api/billing/pay/fedapay { plan }
2. Backend crée transaction FedaPay → retourne { checkoutUrl }
3. Frontend → window.location.href = checkoutUrl
4. Utilisateur paie sur la page FedaPay
5. FedaPay → POST /api/billing/webhook/fedapay (token header)
6. Backend active l'abonnement
7. FedaPay redirige vers FRONTEND_URL/companies/billing?status=success
```

---

## Messagerie (`/api/messaging`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/messaging/conversations` | Auth | Mes conversations |
| GET | `/api/messaging/conversations/support` | Auth | Conversation support (créée si absente) |
| GET | `/api/messaging/conversations/unread` | Auth | Nombre de messages non lus |
| GET | `/api/messaging/conversations/:id/messages` | Auth | Messages d'une conversation |
| POST | `/api/messaging/conversations/:id/messages` | Auth | Envoyer un message |
| PATCH | `/api/messaging/conversations/:id/read` | Auth | Marquer comme lu |

---

## Espace employé personnel (`/api/employee`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/employee/dashboard` | Auth (EMPLOYE) | Tableau de bord personnel |
| GET | `/api/employee/travels` | Auth | Mes demandes de voyage |
| POST | `/api/employee/travels` | Auth | Soumettre une demande de voyage |
| GET | `/api/employee/expenses` | Auth | Mes notes de frais |
| POST | `/api/employee/expenses` | Auth | Créer une note de frais |
| **GET** | **`/api/employee/benefits/categories`** | **Auth** | **Catégories disponibles + soldes** |
| **GET** | **`/api/employee/benefits/balance`** | **Auth** | **Solde avantages annuel** |
| **GET** | **`/api/employee/benefits/requests`** | **Auth** | **Mes demandes d'avantages** |
| **POST** | **`/api/employee/benefits/requests`** | **Auth** | **Soumettre une demande d'avantage** |
| **PATCH** | **`/api/employee/benefits/requests/:id/cancel`** | **Auth** | **Annuler une demande en attente** |
| GET | `/api/employee/profile` | Auth | Mon profil complet |
| PATCH | `/api/employee/profile` | Auth | Modifier mon profil |
| GET | `/api/employee/documents` | Auth | Mes documents |
| POST | `/api/employee/documents` | Auth | Ajouter un document |
| DELETE | `/api/employee/documents/:id` | Auth | Supprimer un document |

### `POST /api/employee/benefits/requests` — Corps de la requête
```json
{
  "categoryId": "clxxxxx",
  "amount": 50000,
  "description": "Abonnement salle de sport",
  "urgency": "MEDIUM"
}
```

### `GET /api/employee/benefits/balance` — Réponse
```json
{
  "totalLimit": 250000,
  "totalUsed": 50000,
  "totalRemaining": 200000,
  "byCategory": [
    { "id": "...", "name": "Sport", "limit": 100000, "used": 50000, "remaining": 50000 }
  ]
}
```

---

## Événements (`/api/events`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/events` | Auth | Liste des événements (filtre mois/année) |
| GET | `/api/events/upcoming` | Auth | Prochains événements |
| GET | `/api/events/stats` | Auth | Statistiques événements |
| POST | `/api/events` | ADMIN, MANAGER | Créer un événement |
| POST | `/api/events/:id/register` | Auth | S'inscrire à un événement |
| DELETE | `/api/events/:id/register` | Auth | Se désinscrire |

---

## Communication interne (`/api/communication`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/communication/posts` | Auth | Liste des posts (paginée) |
| POST | `/api/communication/posts` | Auth | Créer un post/sondage |
| POST | `/api/communication/posts/:id/like` | Auth | Liker/unliker un post |
| POST | `/api/communication/posts/:id/comment` | Auth | Commenter un post |
| POST | `/api/communication/poll-options/:id/vote` | Auth | Voter sur un sondage |

---

## Catalogue avantages (`/api/catalog`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| GET | `/api/catalog` | Public | Liste du catalogue (filtres: category, search) |
| GET | `/api/catalog/categories` | Public | Catégories du catalogue |
| GET | `/api/catalog/:id` | Public | Détail d'un item catalogue |

---

## RBAC — Hiérarchie des rôles

| Rôle | Périmètre | Peut gérer |
|------|-----------|------------|
| SUPER_ADMIN | Plateforme | Toutes les orgs, billing global, settings |
| ADMIN | Organisation | Utilisateurs, modules, avantages, voyages |
| MANAGER | Organisation | Employés, approbations, voyages |
| RH | Organisation | Employés, demandes avantages |
| FINANCE | Organisation | Billing, factures |
| EMPLOYE | Personnel | Son profil, ses demandes, ses voyages |

---

## Codes d'erreur courants

| Code | Signification |
|------|---------------|
| 400 | Données invalides / règle métier violée |
| 401 | Non authentifié (cookie expiré) |
| 403 | Accès refusé (rôle insuffisant) |
| 404 | Ressource introuvable |
| 429 | Rate limit dépassé |
| 500 | Erreur serveur interne |
