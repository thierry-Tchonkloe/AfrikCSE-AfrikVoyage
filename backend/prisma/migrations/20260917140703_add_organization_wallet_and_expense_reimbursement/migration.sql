-- AlterEnum
ALTER TYPE "WalletEntryType" ADD VALUE 'EXPENSE_REIMBURSEMENT';

-- AlterTable
ALTER TABLE "travel_policies" ADD COLUMN     "maxExpenseAmount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "organization_wallets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_wallet_entries" (
    "id" TEXT NOT NULL,
    "organizationWalletId" TEXT NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "runningBalance" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_wallet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_wallets_organizationId_key" ON "organization_wallets"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_wallet_entries_idempotencyKey_key" ON "organization_wallet_entries"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "organization_wallets" ADD CONSTRAINT "organization_wallets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_wallet_entries" ADD CONSTRAINT "organization_wallet_entries_organizationWalletId_fkey" FOREIGN KEY ("organizationWalletId") REFERENCES "organization_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
