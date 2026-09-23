# API Développeur — Guide d'intégration tierce

Ce document s'adresse aux développeurs tiers souhaitant s'intégrer à la plateforme
AfrikCSE & AfrikVoyage via des clés API générées depuis l'espace Super Admin
(`/admin/developer`).

## 1. Authentification par clé API

Chaque appel à l'API publique doit porter l'en-tête `x-api-key` :

```bash
curl https://<votre-domaine>/api/v1/public/ping \
  -H "x-api-key: ak_votre_cle_ici"
```

- La clé est générée une seule fois depuis `/admin/developer` → **Créer un client API**.
  Elle n'est jamais réaffichée après sa création : conservez-la immédiatement dans
  un gestionnaire de secrets.
- Une clé révoquée ou expirée renvoie `401 { "message": "Clé API révoquée" }` (ou
  `"Clé API expirée"`).
- Une clé inconnue renvoie `401 { "message": "Clé API invalide" }`.
- Si l'organisation propriétaire de la clé n'a pas l'API développeur activée
  (`developerApiEnabled`) ou n'est pas active, la requête est rejetée en `403`.

**Cache de validation** : par souci de performance, le résultat de la validation
d'une clé est mis en cache en mémoire côté serveur pendant une courte durée
(120 secondes par défaut, réglable via `API_KEY_CACHE_TTL_SECONDS`). Concrètement,
une clé que vous venez de révoquer peut encore fonctionner jusqu'à cette durée sur
une intégration qui l'utilisait déjà — dont il faut tenir compte si vous
implémentez une procédure de révocation d'urgence.

### Endpoint de test

```
GET /api/v1/public/ping
```

Répond `200` avec `{ message: "pong", clientId, orgId, scopes, timestamp }` si la
clé est valide. C'est le point de départ recommandé pour vérifier une intégration
— voir aussi le script [`scripts/test-public-api.js`](../scripts/test-public-api.js) :

```bash
node scripts/test-public-api.js ak_votre_cle_ici https://<votre-domaine>/api
```

> **Scopes** — chaque client API porte une liste de `scopes` (visibles dans la
> réponse de `/ping`), mais aucun endpoint ne les vérifie encore aujourd'hui au-delà
> de leur simple présence en base : ils servent de déclaration d'intention, pas
> (encore) d'un contrôle d'accès appliqué.

## 2. Webhooks

Configurez un endpoint HTTPS depuis `/admin/developer` → **Webhooks**, en
sélectionnant les événements à recevoir.

### Événements réellement déclenchés aujourd'hui

| Événement | Déclenché quand… |
|---|---|
| `booking.confirmed` | le partenaire confirme une réservation (`PATCH /bookings/partner/:id/confirm`) |
| `booking.rejected` | le partenaire refuse une réservation |
| `booking.completed` | le partenaire marque une réservation comme terminée |
| `booking.cancelled` | l'employé annule sa propre réservation |
| `travel.approved` | un manager/RH approuve une demande de voyage d'affaires (y compris via l'approbation groupée) |
| `travel.rejected` | un manager/RH rejette une demande de voyage d'affaires |

### Événements listés mais pas encore branchés

`order.confirmed`, `order.cancelled` et `wallet.credited` apparaissent dans la
liste de sélection de l'UI mais **ne sont pas encore émis** par le code métier —
aucun module `orders`/`wallet` n'appelle le dispatcher pour l'instant. Ne
comptez pas dessus tant qu'ils ne sont pas confirmés fonctionnels.

### Format de la requête reçue

Chaque événement est livré en `POST` vers l'URL configurée :

```http
POST <votre-url>
Content-Type: application/json
X-AfrikCSE-Event: booking.confirmed
X-AfrikCSE-Signature: sha256=<hmac hex>

{"event":"booking.confirmed","data":{...},"timestamp":"2026-09-09T12:00:00.000Z"}
```

- Timeout serveur : 8 secondes.
- **Pas de retry automatique actuellement** : un envoi qui échoue (timeout, 4xx/5xx)
  est journalisé comme échoué, mais n'est pas rejoué. Consultez l'historique des
  livraisons dans `/admin/developer` pour surveiller les échecs.

### Vérifier la signature HMAC

Le secret est généré à la création du webhook (visible une seule fois, comme la
clé API). La signature est un HMAC-SHA256 du **corps brut** de la requête
(la chaîne JSON telle qu'envoyée, avant tout re-parsing) :

```js
const crypto = require("crypto");

function isValidSignature(rawBody, signatureHeader, secret) {
    // rawBody = corps brut de la requête (string), PAS req.body déjà parsé/réordonné
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}
```

⚠️ Utilisez toujours le corps **brut** (avant `JSON.parse`) pour le calcul — un
JSON re-sérialisé peut réordonner les clés et invalider la comparaison. Avec
Express, désactivez le parsing JSON automatique sur cette route ou utilisez
`express.raw({ type: "application/json" })` pour accéder au buffer brut.

## 3. Limites

- Rate limiting global : 100 requêtes / 15 minutes par IP (partagé avec le reste
  de l'API), configurable via `RATELIMIT_MAX`.
- Une seule instance backend en production (plan Render gratuit) — pas de garantie
  de haute disponibilité à ce stade.
