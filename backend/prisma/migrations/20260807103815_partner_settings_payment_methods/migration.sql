-- CreateEnum
CREATE TYPE "PartnerPaymentMethodType" AS ENUM ('MOBILE_MONEY', 'BANK_TRANSFER', 'OTHER');

-- AlterTable
ALTER TABLE "partner_locations" ADD COLUMN     "mapsUrl" TEXT;

-- AlterTable
ALTER TABLE "partners" ADD COLUMN     "currencyCode" TEXT NOT NULL DEFAULT 'XOF';

-- CreateTable
CREATE TABLE "partner_payment_methods" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" "PartnerPaymentMethodType" NOT NULL,
    "provider" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detailsEncrypted" TEXT NOT NULL,
    "maskedHint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "partner_payment_methods_partnerId_idx" ON "partner_payment_methods"("partnerId");

-- AddForeignKey
ALTER TABLE "partner_payment_methods" ADD CONSTRAINT "partner_payment_methods_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
