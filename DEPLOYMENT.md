# 🚀 Instructions Déploiement Production

## Problèmes corrigés

### 1. ✅ Double Layout
- **Cause** : Layouts imbriqués d'AfrikCSE et Voyage
- **Solution** : Layout parent gère maintenant tous les nav items dynamiquement

### 2. ✅ Auth en Production
- **Cause** : Cookies HTTP-only ne passaient pas entre Vercel et Render
- **Corrections** :
  - `IS_PROD` détection robuste (basée sur `NODE_ENV`)
  - `refreshToken` path changé de `/auth/refresh` à `//` (pour être envoyé à toutes les routes)
  - Accesstoken maxAge 15min au lieu de 60min

---

## ⚙️ Configuration Variables d'Environnement

### 🔴 Backend Render

Va sur `Settings > Environment` dans Render et ajoute :

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]?schema=public
JWT_ACCESS_SECRET=[genère avec: openssl rand -base64 32]
JWT_REFRESH_SECRET=[genère avec: openssl rand -base64 32]
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
FRONTEND_URL=https://afrikcse-afrikvoyage.vercel.app
CLOUDINARY_CLOUD_NAME=[ton_cloudinary_name]
CLOUDINARY_API_KEY=[ton_cloudinary_key]
CLOUDINARY_API_SECRET=[ton_cloudinary_secret]
```

### 🔵 Frontend Vercel

Va sur `Settings > Environment Variables` et ajoute :

```env
NEXT_PUBLIC_API_URL=https://[ton-backend-render-url].onrender.com/api
JWT_SECRET=[doit être le même que JWT_ACCESS_SECRET du backend]
NEXT_PUBLIC_APP_NAME=AfrikCSE & AfrikVoyage
```

---

## 🔧 Trouver les bonnes URLs

### Render Backend URL
1. Va sur ton projet Render
2. Dashboard principal → `External URL` = `https://xxx.onrender.com`
3. API URL = `https://xxx.onrender.com/api`

### Vercel Frontend URL
1. Déjà déployée : probablement `https://afrikcse-afrikvoyage.vercel.app`

---

## 🧪 Tests après déploiement

1. **Login** : `https://afrikcse-afrikvoyage.vercel.app/login`
   - Doit prendre quelques secondes (pas "tourne en boucle")
   - Affiche message de bienvenue

2. **Vérifier cookies** : F12 → Application → Cookies
   - Doit voir `accessToken` et `refreshToken`
   - Domaine : `.vercel.app` (set par le backend sur le domaine Vercel)

3. **Accès page protégée** : `/companies/dashboard`
   - Doit charger sans redirect vers `/login`

4. **API me** : Console → `fetch("https://xxx.onrender.com/api/auth/me", { credentials: 'include' })`
   - Doit retourner `{ user: {...} }`

---

## 🔍 Debugging si ça ne marche pas

### Login tourne en boucle
- [ ] Vérifier `FRONTEND_URL` correct dans Render
- [ ] Vérifier `NEXT_PUBLIC_API_URL` correct dans Vercel
- [ ] Vérifier que le backend rend `HTTP 200` sur `/api/auth/login`

### Pages protégées redirigent vers /login
- [ ] Vérifier cookies dans F12 → Application après login
- [ ] Vérifier que `/api/auth/me` retourne 200 (pas 401)
- [ ] Nettoyer cache et cookies, refaire login

### Cookies ne s'envoient pas au backend
- [ ] Vérifier `CORS` accepte le frontend origin : `FRONTEND_URL=https://africkcse-afrikvoyage.vercel.app`
- [ ] Vérifier `credentials: true` sur les requêtes axios (déjà configuré)
- [ ] Vérifier que les cookies ont `SameSite=None; Secure;` en prod

---

## 📋 Checklist Déploiement

- [ ] Backend Render : vars d'env configurées
- [ ] Frontend Vercel : vars d'env configurées  
- [ ] Faire un `npm run build` local pour vérifier (pas d'erreurs TypeScript)
- [ ] Push les changements (`git push`)
- [ ] Render : re-deploy automatiquement (vérifier)
- [ ] Vercel : re-deploy automatiquement (vérifier)
- [ ] Test login + accès page protégée
- [ ] Vérifier cookies dans devtools
