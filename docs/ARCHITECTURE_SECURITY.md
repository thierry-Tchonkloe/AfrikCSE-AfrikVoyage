# Sécurité & Architecture — Espace Employé AfrikVoyage

Ce document résume les correctifs de sécurité et d'architecture apportés lors de
l'audit puis de l'assainissement en 3 vagues de l'Espace Employé
(`frontend/src/app/(employes-space)/employes/*`) et des modules backend
associés. Il s'adresse aux développeurs de l'équipe qui modifieront ce code par
la suite : chaque section explique le **mécanisme actuel**, **pourquoi il existe
sous cette forme**, et les **pièges à éviter** si vous l'étendez.

## 1. Modules payants — middleware `requireModule`

**Fichier** : `backend/src/core/middlewares/requireModule.middleware.ts`

Chaque organisation active ou non deux modules payants sur `Organization`
(`hasVoyage`, `hasCSE`). Avant ce middleware, seule l'UI masquait les sections
désactivées — l'API restait ouverte à quiconque en connaissait les endpoints.

```ts
requireModule("VOYAGE")  // vérifie org.hasVoyage
requireModule("CSE")     // vérifie org.hasCSE
```

Il lit `req.user.organizationId` (posé par `authenticate`), recharge l'org en
base, et renvoie `403 { message: "Module <X> non activé pour votre organisation" }`
si le flag est faux. Il doit donc **toujours être placé après `authenticate`**
dans la chaîne de middlewares.

### Où il est appliqué aujourd'hui

| Module | Routes gated |
|---|---|
| `VOYAGE` | `travels/*`, `employee/travels*`, `flights/search`, `flights/airports`, `hotels/search`, `hotels/cities`, `trains/search`, `trains/cities`, `car-rentals/search`, `car-rentals/cities`, routes employé de `bookings/*` (`POST /`, `GET /`, `GET /:id`, `DELETE /:id`, `POST /:id/rate`) |
| `CSE` | `benefits/*`, `employee/benefits/*` |

### ⚠️ Piège : ne jamais l'appliquer aux routes `/admin/*`

Les routes `/admin/*` de `flights`, `hotels`, `trains`, `car-rentals`
(gestion du catalogue par `SUPER_ADMIN`/`PLATFORM_MANAGER`) et les routes
`/partner/*` et `/admin/all` de `bookings` **n'ont volontairement pas** ce
middleware : ce sont des actions au niveau plateforme, indépendantes du module
activé sur l'organisation *personnelle* de l'appelant (un Super Admin gère le
catalogue de toutes les organisations, pas seulement la sienne). L'appliquer
en `router.use()` global sur ces fichiers de routes casserait la gestion du
catalogue pour tout Super Admin dont l'organisation n'a pas le module actif.

**Pour ajouter une nouvelle route protégée** : insérez `requireModule("VOYAGE" | "CSE")`
directement sur la route concernée (après `authenticate`, avant `authorize`
s'il y en a un) — jamais en `router.use()` sur un fichier qui mélange routes
employé et routes admin/partenaire.

## 2. Anti-fraude — le prix vient TOUJOURS du serveur

**Fichiers** : `backend/src/modules/bookings/application/booking.service.ts`,
`backend/src/modules/orders/application/order.service.ts`

**Le problème corrigé** : ces deux endpoints acceptaient un champ `amount`
envoyé par le client et l'utilisaient tel quel pour débiter le wallet. Un
client pouvait réserver un vol à 250 000 XOF en envoyant `"amount": 1`.

**Le correctif** — le pattern à reproduire pour tout nouvel endpoint qui
débite de l'argent :

```ts
// ❌ Ne JAMAIS faire :
const amount = new Prisma.Decimal(data.amount);

// ✅ Toujours résoudre le prix réel depuis l'entité catalogue :
const route = await prisma.flightRoute.findUnique({
    where: { id: data.flightRouteId },
    select: { basePrice: true, partnerId: true },
});
const amount = route.basePrice.mul(data.numberOfPersons ?? 1);
```

Dans `booking.service.ts` (`create()`, lignes ~56-94), le prix est recalculé
selon le type d'entité ciblée :

| Entité | Prix unitaire | Multiplicateur (fourni par le client, borné 1-90) |
|---|---|---|
| `FlightRoute` | `basePrice` | `numberOfPersons` |
| `TrainRoute` | `basePrice` | `numberOfPersons` |
| `HotelRoomType` | `pricePerNight` | `numberOfNights` |
| `CarRentalVehicle` | `pricePerDay` | `numberOfDays` |
| `BenefitCatalogItem` (offerId) | `employeePrice` | — (unitaire) |

Une réservation qui ne référence **aucune** de ces entités est rejetée
(`400`) — sans entité catalogue, aucun prix n'est vérifiable côté serveur, donc
la requête n'est pas honorée. Le champ `amount` envoyé par le client reste
accepté dans le payload (pour ne pas casser le contrat d'API) mais n'est
**jamais** utilisé pour le débit réel.

Dans `order.service.ts` (`create()`, lignes ~41-58), même principe pour les
commandes catalogue CSE : si `offerId` est fourni, `amount` est recalculé
depuis `BenefitCatalogItem.employeePrice` ; `discountAmount` est neutralisé à
`0` côté serveur (aucun moteur de règles de remise n'existe aujourd'hui pour le
valider — le laisser passer aurait juste déplacé la faille).

### ⚠️ Piège connu, non corrigé

Les paiements `MOBILE_MONEY`/`CARD` sur `Booking` ne débitent **toujours
rien réellement** — seul `paymentMethod: "WALLET"` déclenche un débit
(`booking.service.ts`, bloc `if (data.paymentMethod === "WALLET")`). Une
réservation payée par ces deux méthodes est créée et confirmable par le
partenaire sans qu'aucun argent ne bouge. Il n'y a aucune intégration
KkiaPay/FedaPay sur ce flux (contrairement à `orders`, qui l'a). À traiter
avant d'activer ces méthodes de paiement en production sur les réservations.

## 3. Cloisonnement des conversations de support

**Fichier** : `backend/src/modules/messaging/infrastructure/messaging.repository.ts`,
méthode `getOrCreateSupportConversation(orgId, userId)` (ligne ~287)

**Le problème corrigé** : la recherche de conversation existante ne filtrait
que par `organizationId`. Une organisation n'avait donc qu'**une seule**
conversation de support, partagée par tous ses employés — le premier employé à
ouvrir "Support" créait la conversation, et tout employé suivant y était
silencieusement ajouté comme participant, avec accès à l'historique complet.

**Le correctif** :

```ts
// Scopé par organizationId ET participants.some.userId — chaque appelant
// (employé ou admin) obtient SA PROPRE conversation privée avec les Super
// Admins, jamais partagée.
const existing = await prisma.conversation.findFirst({
    where: { organizationId: orgId, participants: { some: { userId } } },
    include: { participants: true },
});
```

Les autres garde-fous anti-IDOR de ce module étaient déjà corrects avant ce
correctif et n'ont pas été modifiés :
- `isParticipant(conversationId, userId)` gate `getMessages`/`sendMessage` —
  un utilisateur ne peut lire/écrire que dans une conversation dont il est
  membre (403 sinon).
- `getConversationsByOrg` filtre déjà par `participants: { some: { userId } }`.

**Décision de conception explicite** : il n'existe **pas** de mécanisme
permettant à un `ADMIN` de voir les conversations de support de *tous* les
employés de son organisation — chacun (y compris l'admin) n'a accès qu'à la
sienne. C'est un choix délibéré (confidentialité par défaut), pas un oubli. Si
une visibilité élargie pour les rôles d'encadrement est requise un jour, elle
doit être ajoutée explicitement (nouveau rôle vérifié + requête dédiée), pas en
retirant le filtre `participants: { some: { userId } }` existant.

## 4. Liste des départements centralisée

**Fichier** : `frontend/src/lib/departments.ts`

```ts
export const DEPARTMENTS = [
    "Direction", "Ressources Humaines", "Finance & Comptabilité",
    "Commercial & Ventes", "Marketing", "Technologie & IT",
    "Opérations", "Juridique", "Communication", "Autre",
] as const;
export type Department = (typeof DEPARTMENTS)[number];
```

**Le problème corrigé** : cette liste était dupliquée avec des valeurs
différentes dans plusieurs écrans (ex. `"Tech"` vs `"Technologie"` vs
`"Technologie & IT"`). Or `TravelPolicy.appliesToDepartments` résout la
politique applicable à une demande de voyage par **égalité stricte de chaîne**
sur `User.department` (`backend/src/modules/employee/infrastructure/employee-dashboard.repository.ts`,
`createTravelRequest`) : un écart de libellé rendait un employé invisible à la
politique de son propre département, sans erreur visible.

**Fichiers qui consomment `DEPARTMENTS` aujourd'hui** :
`app/complete-profile`, `app/(employes-space)/employes/profile`,
`app/(company-space)/companies/users`,
`app/(company-space)/companies/AfrikVoyage/{politiques,reservations,approbations,frais}`.

**Règle pour tout nouvel écran qui saisit ou filtre un département** :
importer `DEPARTMENTS`/`Department` depuis ce fichier, ne jamais redéclarer de
liste locale. `User.department` reste un champ texte libre côté Prisma (pas
d'enum) — cette constante est la seule source de vérité, mais uniquement
**côté frontend** : le backend n'impose aucune contrainte contre cette liste
sur `PATCH /employee/profile` (`updateProfileSchema.department` accepte
n'importe quelle chaîne). Si une validation stricte est nécessaire un jour,
elle doit être ajoutée côté Zod backend, avec la même liste comme source.

## Résumé des trois vagues de correctifs

| Vague | Objectif | Points clés |
|---|---|---|
| 1 | Débloquer les formulaires cassés par l'idempotence, sécuriser les prix, étendre `requireModule` | 4 services frontend génèrent `idempotencyKey` ; prix serveur sur `Booking`/`Order` ; fuite `password`/`resetPasswordToken` sur `GET /employee/profile` corrigée |
| 2 | Stopper l'écrasement du profil, cloisonner le support, vérifier le remboursement | Page Profil hydratée depuis l'API réelle ; conversations de support scopées par utilisateur ; remboursement wallet à l'annulation (déjà correct, libellé aligné) |
| 3 | Nettoyer l'UI décorative, fiabiliser likes/votes, masquer les actions non autorisées | Stubs 2FA/Export PDF/onglets inertes retirés ; réhydratation likes/votes depuis l'API (`communication.repository.getPosts` étendu) ; bouton "Créer un événement" masqué selon le rôle |
