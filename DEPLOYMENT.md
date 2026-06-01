# 🚀 Instructions Déploiement Production — COMPLÈTE

## 🔴 PROBLÈMES IDENTIFIÉS ET SOLUTIONS

### 1. ❌ JWT Secret Mismatch
**Problème** : Backend et Frontend devaient utiliser le même `JWT_SECRET` mais utilisaient des noms différents
- Backend : `JWT_ACCESS_SECRET` + `JWT_REFRESH_SECRET` (deux secrets)
- Frontend : cherchait `JWT_SECRET` (un seul)

**Solution appliquée** :
- Backend maintenant utilise **une seule `JWT_SECRET`** pour les deux tokens (plus simple)
- Frontend middleware utilise la même `JWT_SECRET` pour vérifier

### 2. ❌ Cookies cross-origin bloqués
**Problème** : Frontend sur Vercel, Backend sur Render = domaines différents
- Requêtes axios vers `https://xxx.onrender.com/api/*` ne recevaient pas les cookies du domaine Render

**Solution appliquée** :
- Ajout **rewrite Vercel** : `/api/*` → `https://xxx.onrender.com/api/$1`
- Ainsi, les requêtes semblent venir du même domaine (`vercel.app`)
- Cookies sont set et envoyés correctement via `withCredentials: true`

### 3. ✅ Cookies HTTP-only Path Fix
✅ Déjà corrigé : `refreshToken` path changé de `/auth/refresh` à `/`

---

## ⚙️ Configuration Variables d'Environnement — À FAIRE MAINTENANT

### 📌 Étape 1 : Générer une clé JWT forte
```bash
# Sur ton terminal local
openssl rand -base64 32
# Copie la sortie (ex: a9k2nDxL3qOpQ7vR9mKlM4pT6vW8xYzAb2cDeFgH)
```

### 🔴 Étape 2 : Backend Render

Va sur **Render Dashboard → Ton projet API → Settings → Environment**

Ajoute/Modifie les variables suivantes :

| Variable | Valeur | Notes |
|---|---|---|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | |
| `DATABASE_URL` | `postgresql://...` | Ta vraie URL BDD Render |
| `JWT_SECRET` | `[résultat openssl rand]` | ⚠️ IMPORTANT : même valeur en frontend |
| `JWT_ACCESS_EXPIRES` | `15m` | |
| `JWT_REFRESH_EXPIRES` | `7d` | |
| `FRONTEND_URL` | `https://afrikcse-afrikvoyage.vercel.app` | ⚠️ Exact |
| `CLOUDINARY_CLOUD_NAME` | `[ta valeur]` | |
| `CLOUDINARY_API_KEY` | `[ta valeur]` | |
| `CLOUDINARY_API_SECRET` | `[ta valeur]` | |

✅ **Redeploy** Render après avoir sauvegardé

### 🔵 Étape 3 : Frontend Vercel

Va sur **Vercel Dashboard → Ton projet Frontend → Settings > Environment Variables**

Ajoute/Modifie :

| Variable | Valeur | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api` | ⚠️ Relatif ! Utilise la rewrite |
| `JWT_SECRET` | `[MÊME valeur que Backend JWT_SECRET]` | ⚠️ IMPORTANT : identique |
| `NEXT_PUBLIC_APP_NAME` | `AfrikCSE & AfrikVoyage` | |

✅ **Redeploy** Vercel après avoir sauvegardé

### 📋 Vérifier vercel.json
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

---

## 🧪 Tests après Déploiement

### Test 1 : Login Flow
```
1. Va sur https://afrikcse-afrikvoyage.vercel.app/login
2. Entre email + password
3. Doit voir "Bienvenue" toast
4. Doit être redirigé vers /companies/dashboard ✅
```

### Test 2 : Vérifier Cookies
```
F12 → Application → Cookies → afrikcse-afrikvoyage.vercel.app
Doit voir : ✅ accessToken
           ✅ refreshToken
Attributs : httpOnly, Secure, SameSite=None (en prod)
```

### Test 3 : API Request Directe
```bash
# Dans la console du navigateur
fetch("/api/auth/me", { credentials: "include" })
    .then(r => r.json())
    .then(data => console.log(data))

# Doit afficher: { user: {...} }
```

### Test 4 : Refresh Token (30+ min après login)
```
1. Attends 15+ min (expiration accessToken)
2. Recharge la page
3. Doit TOUJOURS être connecté (pas redirect vers /login)
   → Cela veut dire que le refresh a fonctionné ✅
```

### Test 5 : Logout
```
1. Clique logout
2. Doit rediriger vers /login ✅
3. Cookies doivent être supprimés ✅
```

---

## 🔍 Debugging

### Problem : "401 Unauthorized" après login
```
Checklist:
[ ] JWT_SECRET sur Render = JWT_SECRET sur Vercel ?
[ ] FRONTEND_URL sur Render = https://afrikcse-afrikvoyage.vercel.app ?
[ ] NODE_ENV=production sur Render ?
[ ] Cookies visibles dans devtools ?
[ ] Rewrite /api/* activé dans vercel.json ?
```

### Problem : Pages protégées redirigent vers /login
```
Checklist:
[ ] /api/auth/me retourne 200 (pas 401) ?
[ ] accessToken cookie existe et n'est pas expiré ?
[ ] JWT_SECRET matching entre Backend et Frontend ?
[ ] Vercel redeployed après changement JWT_SECRET ?
```

### Problem : "Cannot find module or missing env var"
```
[ ] Tous les .env.production remplis sur Render/Vercel ?
[ ] Pas d'erreur de syntax dans .env ?
[ ] Redeploy forcé : Render/Vercel → Redeploy
```

---

## 📝 Résumé des Changements

✅ `backend/src/core/utils/jwt.ts` — Une seule secret pour access + refresh
✅ `backend/.env.production` — Template mis à jour
✅ `frontend/vercel.json` — Rewrite `/api/*` ajouté
✅ Documentation de déploiement complète

---

## 🎯 Déploiement Pas à Pas

```bash
# 1. Commit les changements
git add -A
git commit -m "fix: jwt secret unification and api rewrite"
git push origin tchonkloe

# 2. Render : Ajouter les env vars (voir Étape 2 ci-dessus)
# 3. Vercel : Ajouter les env vars (voir Étape 3 ci-dessus)
# 4. Vercel : Redeploy (triggers automatically on push)
# 5. Render : Redeploy (check dashboard for auto-deploy)

# 6. Tests locaux d'abord
npm run build  # backend
npm run build  # frontend

# 7. Test en prod
```


