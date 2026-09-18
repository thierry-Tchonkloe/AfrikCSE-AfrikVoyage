-- Aligne BenefitCategory.currency sur le reste de la plateforme (XOF partout).
-- C'était le seul champ du schéma à défauter sur "EUR" ; source de la
-- contamination € observée dans budget/page.tsx et avantages/page.tsx (aucune
-- organisation n'utilise réellement l'EUR aujourd'hui).
ALTER TABLE "benefit_categories" ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- Backfill : les lignes existantes encore sur la valeur par défaut EUR
-- basculent vers XOF. On ne touche pas une valeur EUR qui aurait été
-- explicitement définie autrement (aucun cas connu aujourd'hui).
UPDATE "benefit_categories" SET "currency" = 'XOF' WHERE "currency" = 'EUR';
