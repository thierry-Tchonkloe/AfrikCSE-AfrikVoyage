# 🚀 Setup Backend SaaS (Node.js + Prisma)

## 1. Installer les dépendances

npm install

## 2. Configurer les variables d'environnement

cp .env.example .env

## 3. Lancer la base de données (PostgreSQL)

## 4. Lancer les migrations

npx prisma migrate dev

## 5. Générer Prisma Client

npx prisma generate

## 6. Lancer le projet

npm run dev

---

## 🧬 Commandes utiles

### Nouvelle migration

npx prisma migrate dev --name nom_de_la_migration

### Reset DB

npx prisma migrate reset

### Voir la DB (GUI)

npx prisma studio

---

## ⚠️ Bonnes pratiques

* Ne jamais commit `.env`
* Toujours utiliser `migrate` (pas `db push`)
* Nommer les migrations correctement
* Faire des pull avant migration
