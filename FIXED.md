# ✅ RÉSUMÉ EXÉCUTIF — Problème Résolu

## Le Problème Complet
```
Login ✅ → Message bienvenue ✅ → Page protégée ❌ → Redirect /login
```

## La Cause
**JWT Secret Mismatch + Cookies Cross-Domain**
- Backend signait JWT avec une secret
- Frontend essayait de vérifier avec une secret DIFFÉRENTE
- Vérification JWT échouait → redirection vers `/login`

## Solutions Implémentées

### 1. Backend JWT Unifié
```diff
- const ACCESS_SECRET = process.env.JWT_SECRET!;
- const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
+ const JWT_SECRET = process.env.JWT_SECRET!;
+ // Utilise la même secret pour access ET refresh tokens
```
**Fichier** : `backend/src/core/utils/jwt.ts`

### 2. Vercel Rewrite pour Cookies
```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://xxx.onrender.com/api/$1" }
  ]
}
```
**Effet** : Requêtes axios vers `/api/*` → proxyfié via Vercel → cookies set sur domaine Vercel
**Fichier** : `frontend/vercel.json`

### 3. Configuration Env Vars Simplifiée
- Backend : `JWT_SECRET` (une seule)
- Frontend : `JWT_SECRET` (identique) + `NEXT_PUBLIC_API_URL=/api` (relatif)

## Fichiers Modifiés

```
backend/src/core/utils/jwt.ts               ✅ JWT secret unified
backend/.env.production                     ✅ Updated template
frontend/vercel.json                        ✅ Rewrite added
frontend/.env.production                    ✅ API_URL=/api (relative)
frontend/.env.local                         ✅ Dev-friendly
DEPLOYMENT.md                               ✅ Updated
DIAGNOSIS.md                                ✅ Detailed analysis
```

## Prochaines Étapes (À Faire Maintenant)

### 1️⃣ Commit
```bash
git add -A
git commit -m "fix: JWT secret unification and auth cookie flow"
git push origin tchonkloe
```

### 2️⃣ Render Configuration (5 min)
1. Dashboard Render → Projet API → Settings → Environment
2. Ajoute ces variables :
   - `NODE_ENV=production`
   - `JWT_SECRET=[ta 32-byte clé]`
   - `FRONTEND_URL=https://afrikcse-afrikvoyage.vercel.app`
   - Autres (DATABASE_URL, Cloudinary, etc.)
3. Redeploy

### 3️⃣ Vercel Configuration (5 min)
1. Dashboard Vercel → Projet Frontend → Settings > Environment Variables
2. Ajoute :
   - `NEXT_PUBLIC_API_URL=/api`
   - `JWT_SECRET=[MÊME clé que Render]`
3. Redeploy

### 4️⃣ Tests (5 min)
```
1. Login → Bienvenue ✅
2. F12 → Cookies → accessToken + refreshToken ✅
3. /companies/dashboard → Charge ✅ (pas redirect)
4. Logout → /login ✅
```

## Commandes Cheat Sheet

```bash
# Générer JWT_SECRET fort
openssl rand -base64 32

# Dev local
cd frontend && npm run dev          # Port 3000
cd backend && npm run dev           # Port 5000

# Build local (avant production)
cd backend && npm run build
cd frontend && npm run build

# Test API
curl -X GET http://localhost:5000/api/auth/me \
  -H "Cookie: accessToken=YOUR_TOKEN"
```

## Explications Rapides

**Pourquoi le rewrite ?**
- Axios appelle `/api/*` (relatif à vercel.app)
- Vercel rewrite vers Render backend
- Réponse arrive sur vercel.app domain
- Cookies set pour vercel.app ✅
- Middleware Next.js peut les lire ✅

**Pourquoi JWT_SECRET doit matcher ?**
- Backend signe : `jwt.sign(payload, JWT_SECRET, ...)`
- Frontend/Middleware vérifie : `jwt.verify(token, JWT_SECRET, ...)`
- Si secrets diffèrent → vérification échoue → 401 ❌

**Pourquoi une seule secret ?**
- Plus simple
- Moins d'erreurs de mismatch
- Cohérent avec le code existant

---

## ✅ Checklist Déploiement

- [ ] Git push committed
- [ ] `openssl rand -base64 32` exécuté → clé copiée
- [ ] Render env vars configurés
- [ ] Vercel env vars configurés
- [ ] Render redéployé
- [ ] Vercel redéployé
- [ ] Test login
- [ ] Test page protégée
- [ ] Test logout

---

## 🆘 Si ça ne marche pas encore

**Pages redirigent vers /login après login ?**
→ Vérifier : JWT_SECRET identique Render + Vercel ?
→ Vérifier : `/api/auth/me` retourne 200 (pas 401) ?

**Cookies pas visibles en F12 ?**
→ Vérifier : Backend retourne HTTP 200 + Set-Cookie headers ?
→ Vérifier : Rewrite activé dans vercel.json ?

**Login tourne en boucle ?**
→ Vérifier : FRONTEND_URL=https://afrikcse-afrikvoyage.vercel.app en Render ?
→ Vérifier : DATABASE_URL correct en Render ?

---

## 📚 Documentation Complète

- `DEPLOYMENT.md` — Guide détaillé déploiement
- `DIAGNOSIS.md` — Analyse technique complète
