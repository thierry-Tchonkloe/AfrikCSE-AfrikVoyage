# 🔴 DIAGNOSTIC FINAL — Problème d'Accès Pages Protégées

## Cause Racine : JWT Secret Mismatch + Cookies Cross-Domain

### 1️⃣ Problème Principal
Après login :
- ✅ Notification "Bienvenue" s'affiche → login fonctionne
- ✅ `/api/auth/me` retourne les données correctement
- ❌ Pages protégées redirigent immédiatement vers `/login`

**Pourquoi ?** Le middleware Next.js ne peut pas vérifier le JWT car :
- Backend signe avec une secret
- Frontend essaie de vérifier avec une **secret DIFFÉRENTE**
→ Vérification JWT échoue → redirection `/login`

### 2️⃣ Mismatch Identifiés

**Backend (`jwt.ts`):**
```typescript
const ACCESS_SECRET = process.env.JWT_SECRET!;     // Cherche JWT_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;  // Cherche JWT_REFRESH_SECRET
```

**Frontend (`middleware.ts`):**
```typescript
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);  // Cherche JWT_SECRET
```

**Problème en production :**
- Backend `.env.production` demandait `JWT_ACCESS_SECRET` (ne correspond pas)
- Frontend cherchait `JWT_SECRET`
- Résultat : deux secrets DIFFÉRENTES → vérification échoue

### 3️⃣ Solutions Appliquées

#### ✅ Backend JWT Unifié
- Changé `jwt.ts` pour utiliser **une seule `JWT_SECRET`** pour les deux tokens
- Élimine le risque de mismatch entre deux secrets

#### ✅ Frontend Rewrite Vercel
- Ajouté rewrite `/api/*` → `https://xxx.onrender.com/api/$1`
- Ainsi les cookies sont set sur le domaine Vercel (pas Render)
- Middleware Next.js peut les lire correctement

#### ✅ Documentation Production
- Créé `DEPLOYMENT.md` avec checklist précise des env vars

---

## 📋 À Faire Maintenant

### Étape 1 : Commit les changements
```bash
git add .
git commit -m "fix: jwt secret unification and auth flow"
git push origin tchonkloe
```

### Étape 2 : Vérifier `vercel.json` (déjà fait)
```json
{
    "rewrites": [
        {
            "source": "/api/(.*)",
            "destination": "https://[TON-RENDER-URL].onrender.com/api/$1"
        }
    ]
}
```

### Étape 3 : Générer JWT_SECRET fort
```bash
openssl rand -base64 32
# Copie la sortie (ex: a9k2nDxL3qOpQ7vR9mKlM4pT6vW8xYzAb2cDeFgH)
```

### Étape 4 : Configurer Render
1. Dashboard Render → Projet API → Settings → Environment
2. Ajoute:
   - `NODE_ENV` = `production`
   - `PORT` = `5000`
   - `DATABASE_URL` = `postgresql://...`
   - `JWT_SECRET` = `[résultat openssl]`
   - `JWT_ACCESS_EXPIRES` = `15m`
   - `JWT_REFRESH_EXPIRES` = `7d`
   - `FRONTEND_URL` = `https://afrikcse-afrikvoyage.vercel.app`
   - Autres (Cloudinary, etc.)
3. Redeploy

### Étape 5 : Configurer Vercel
1. Dashboard Vercel → Projet Frontend → Settings > Environment Variables
2. Ajoute:
   - `NEXT_PUBLIC_API_URL` = `/api` (relatif pour utiliser la rewrite)
   - `JWT_SECRET` = `[MÊME valeur que Render]`
   - `NEXT_PUBLIC_APP_NAME` = `AfrikCSE & AfrikVoyage`
3. Redeploy

---

## 🧪 Tests Après Déploiement

### Test 1 : Login
```
https://afrikcse-afrikvoyage.vercel.app/login
→ Bienvenue [nom] ✅
→ Redirect vers /companies/dashboard ✅
```

### Test 2 : Cookies
```
F12 → Application → Cookies
→ accessToken ✅
→ refreshToken ✅
Domain: afrikcse-afrikvoyage.vercel.app ✅
```

### Test 3 : Page Protégée
```
https://afrikcse-afrikvoyage.vercel.app/companies/dashboard
→ Doit charger (pas redirect vers /login) ✅
```

### Test 4 : API Direct
```javascript
// Console browser
fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(console.log)

// Doit retourner: { user: {...} } ✅
```

---

## 🔧 Fichiers Modifiés

```
backend/src/core/utils/jwt.ts
├─ Utilise une seule JWT_SECRET (pas deux)
├─ Plus simple et moins d'erreurs

backend/.env.production
├─ Template mis à jour

frontend/vercel.json
├─ Rewrite /api/* vers Render backend

DEPLOYMENT.md
├─ Documentation complète de déploiement
```

---

## ⚠️ Points Critiques

1. **JWT_SECRET DOIT être identique** entre Backend et Frontend
2. **FRONTEND_URL DOIT pointer vers le domaine Vercel** (pour CORS)
3. **Rewrite `/api/*` DOIT être activé** dans vercel.json
4. **Redeploy APRÈS chaque changement** d'env vars

---

## 💡 Explications Techniques

### Pourquoi le middleware Read les cookies ?
1. Login → Backend set cookies `Set-Cookie: accessToken=...`
2. Frontend reçoit les cookies via le rewrite Vercel
3. Navigateur les stocke pour le domaine `vercel.app`
4. Middleware Next.js lit les cookies via `request.cookies.get("accessToken")`
5. Middleware vérifie la signature JWT avec `JWT_SECRET`
6. ✅ Si signatures match → autorisation donnée
7. ❌ Si secrets diffèrent → redirection `/login`

### Pourquoi rewrite ?
- Sans rewrite : axios appelle `https://onrender.com/api/*` → cookies du domaine `onrender.com`
- Navigateur refuse d'envoyer cookies cross-domain (SameSite protection)
- Avec rewrite : requête semble être sur `vercel.app` → cookies du domaine `vercel.app`
- Navigateur autorise car c'est same-site ✅

