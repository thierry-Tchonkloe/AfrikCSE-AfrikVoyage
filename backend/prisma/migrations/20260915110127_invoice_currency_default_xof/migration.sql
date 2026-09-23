-- Aligne Invoice.currency sur le reste de la plateforme (XOF partout) — comme
-- BenefitCategory avant elle, c'était le seul autre champ à défauter sur "EUR"
-- alors qu'aucun flux de paiement (KkiaPay, FedaPay, carte) ne facture jamais
-- réellement en EUR.
ALTER TABLE "invoices" ALTER COLUMN "currency" SET DEFAULT 'XOF';

-- Corrige les factures KkiaPay historiques : processKkiapayPayment divisait
-- par erreur un montant déjà exprimé en XOF pleins (ex: 175000, celui envoyé
-- au widget) par 100, produisant un montant stocké 100x trop petit (1750 au
-- lieu de 175000). Restreint à KKIAPAY car FedaPay/Carte n'ont jamais utilisé
-- ce chemin de calcul (aucune facture FEDAPAY/CARD n'existe avec ce défaut).
UPDATE "invoices" SET "amount" = "amount" * 100, "currency" = 'XOF'
WHERE "currency" = 'EUR' AND "paymentMethod" = 'KKIAPAY';

-- Toute autre facture encore sur le défaut EUR n'a qu'une étiquette de devise
-- fausse (pas de bug de montant associé) : simple correction du libellé.
UPDATE "invoices" SET "currency" = 'XOF' WHERE "currency" = 'EUR';
