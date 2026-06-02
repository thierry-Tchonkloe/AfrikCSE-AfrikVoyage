# Documentation API Backend

## Base URL

Toutes les routes sont exposées sous le préfixe :

- `/api`
- Exemple : `https://your-backend.example.com/api/auth/login`

## Liste des routes accessibles depuis `GET /api`

L'endpoint `GET /api` retourne un objet JSON listant les groupes de routes disponibles et leurs verbes HTTP.

## Point de terminaison global

- `GET /health`
  - Vérifie que le serveur fonctionne.
  - Réponse : `{ status: "ok", timestamp: "..." }`

- `GET /api`
  - Retourne la liste des routes API disponibles.

---

## Authentification (`/api/auth`)

- `POST /api/auth/register-company`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PATCH /api/auth/complete-profile`
- `POST /api/auth/activate`

---

## Organisations (`/api/organizations`)

- `GET /api/organizations`
- `POST /api/organizations`
- `GET /api/organizations/paginated`
- `GET /api/organizations/my/dashboard`
- `GET /api/organizations/:id`
- `PATCH /api/organizations/:id/validate`
- `PATCH /api/organizations/:id/reject`
- `PATCH /api/organizations/:id/modules`
- `PATCH /api/organizations/:id/suspend`
- `PATCH /api/organizations/:id/validate-invite`
- `DELETE /api/organizations/:id`

---

## Utilisateurs (`/api/users`)

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/role`
- `PATCH /api/users/:id/deactivate`
- `PATCH /api/users/:id/activate`

---

## Paramètres (`/api/settings`)

- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/settings/dashboard`

---

## Contact (`/api/contact`)

- `POST /api/contact`
- `GET /api/contact`
- `PATCH /api/contact/:id/status`

---

## Employés globaux (`/api/employees`)

- `GET /api/employees`
- `GET /api/employees/stats`
- `GET /api/employees/:id`

---

## Avantages (`/api/benefits`)

- `GET /api/benefits/categories`
- `POST /api/benefits/categories`
- `PATCH /api/benefits/categories/:id`
- `DELETE /api/benefits/categories/:id`
- `GET /api/benefits/requests`
- `GET /api/benefits/requests/stats`
- `PATCH /api/benefits/requests/:id/approve`
- `PATCH /api/benefits/requests/:id/reject`
- `POST /api/benefits/requests/bulk-approve`
- `GET /api/benefits/report`

---

## Facturation (`/api/billing`)

- `GET /api/billing`
- `POST /api/billing/upgrade`
- `GET /api/billing/invoices`
- `POST /api/billing/pay/kkiapay`
- `POST /api/billing/pay/fedapay`
- `POST /api/billing/pay/card`

---

## Messagerie (`/api/messaging`)

- `GET /api/messaging/conversations`
- `GET /api/messaging/conversations/support`
- `GET /api/messaging/conversations/unread`
- `GET /api/messaging/conversations/:id/messages`
- `POST /api/messaging/conversations/:id/messages`
- `PATCH /api/messaging/conversations/:id/read`

---

## Espace employé (`/api/employee`)

- `GET /api/employee/dashboard`
- `GET /api/employee/travels`
- `POST /api/employee/travels`
- `GET /api/employee/expenses`
- `POST /api/employee/expenses`
- `GET /api/employee/profile`
- `PATCH /api/employee/profile`
- `GET /api/employee/documents`
- `POST /api/employee/documents`
- `DELETE /api/employee/documents/:id`

---

## Événements (`/api/events`)

- `GET /api/events`
- `GET /api/events/upcoming`
- `GET /api/events/stats`
- `POST /api/events`
- `POST /api/events/:id/register`
- `DELETE /api/events/:id/register`

---

## Communication interne (`/api/communication`)

- `GET /api/communication/posts`
- `POST /api/communication/posts`
- `POST /api/communication/posts/:id/like`
- `POST /api/communication/posts/:id/comment`
- `POST /api/communication/poll-options/:id/vote`

---

## Catalogue (`/api/catalog`)

- `GET /api/catalog`
- `GET /api/catalog/categories`
- `GET /api/catalog/:id`

---

## Notes importantes

- Certaines routes nécessitent un token d'authentification (`authenticate`).
- Certaines routes sont réservées à des rôles spécifiques (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `RH`, `FINANCE`).
- Consultez les contrôleurs correspondants pour connaître le format exact des requêtes et des réponses.
