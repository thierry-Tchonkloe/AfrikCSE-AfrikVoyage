-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "checkoutUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_transactionId_key" ON "orders"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_payouts_partnerId_period_key" ON "partner_payouts"("partnerId", "period");

