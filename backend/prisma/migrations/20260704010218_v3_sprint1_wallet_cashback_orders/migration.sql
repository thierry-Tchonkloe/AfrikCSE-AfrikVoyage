-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('ALLOCATION', 'DEBIT', 'SUBSIDY_CREDIT', 'CASHBACK_CREDIT', 'CASHBACK_REVERSAL', 'REFUND', 'EXPIRY', 'REWARD_CREDIT');

-- CreateEnum
CREATE TYPE "CashbackType" AS ENUM ('MERCHANT', 'EMPLOYER', 'HYBRID', 'CAMPAIGN');

-- CreateEnum
CREATE TYPE "CashbackStatus" AS ENUM ('CALCULATED', 'CREDITED', 'PENDING_REVIEW', 'REVERSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "OrderPaymentStatus" AS ENUM ('UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PLATFORM_MANAGER';

-- AlterTable
ALTER TABLE "benefit_catalog_items" ADD COLUMN     "cashbackRuleId" TEXT;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT 'CI',
ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
ADD COLUMN     "defaultLocale" TEXT NOT NULL DEFAULT 'fr',
ADD COLUMN     "developerApiEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "bankDetailsEncrypted" TEXT,
ADD COLUMN     "cancellationPolicy" TEXT,
ADD COLUMN     "mobileMoneyNumberEncrypted" TEXT,
ADD COLUMN     "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "memberCardToken" TEXT,
ADD COLUMN     "notifNewPartnerOffer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferredLocale" TEXT NOT NULL DEFAULT 'fr';

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_entries" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletEntryType" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "runningBalance" DECIMAL(14,2) NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashback_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "partnerId" TEXT,
    "type" "CashbackType" NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "fixedAmount" DECIMAL(14,2),
    "maxPerEmployee" DECIMAL(14,2),
    "maxPerPeriod" DECIMAL(14,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashback_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cashback_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT,
    "ticketId" TEXT,
    "ruleId" TEXT NOT NULL,
    "rawAmount" DECIMAL(14,2) NOT NULL,
    "creditedAmount" DECIMAL(14,2) NOT NULL,
    "status" "CashbackStatus" NOT NULL DEFAULT 'CALCULATED',
    "fraudScore" DECIMAL(5,4) DEFAULT 0,
    "idempotencyKey" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cashback_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_signals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "score" DECIMAL(5,4) NOT NULL,
    "metadata" JSONB,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fraud_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "partnerId" TEXT,
    "offerId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "discountAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subsidyAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cashbackAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "finalAmount" DECIMAL(14,2) NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
    "paymentMethod" TEXT,
    "paymentStatus" "OrderPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "transactionId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_entries_idempotencyKey_key" ON "wallet_entries"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "cashback_transactions_idempotencyKey_key" ON "cashback_transactions"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "benefit_catalog_items" ADD CONSTRAINT "benefit_catalog_items_cashbackRuleId_fkey" FOREIGN KEY ("cashbackRuleId") REFERENCES "cashback_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_entries" ADD CONSTRAINT "wallet_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_rules" ADD CONSTRAINT "cashback_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_rules" ADD CONSTRAINT "cashback_rules_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_transactions" ADD CONSTRAINT "cashback_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cashback_transactions" ADD CONSTRAINT "cashback_transactions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "cashback_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
