-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PartnerScope" AS ENUM ('CSE', 'VOYAGE', 'BOTH');

-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('VOUCHER', 'BOOKING', 'DISCOUNT_CODE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'NEW_PARTNER_OFFER';
ALTER TYPE "NotificationType" ADD VALUE 'PHOTO_PENDING_MODERATION';

-- AlterTable
ALTER TABLE "api_integrations" ADD COLUMN     "integrationType" TEXT NOT NULL DEFAULT 'HR_SYSTEM';

-- AlterTable
ALTER TABLE "benefit_catalog_items" ADD COLUMN     "boostLabel" TEXT,
ADD COLUMN     "boostUntil" TIMESTAMP(3),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "isCommitteeChoice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ADD COLUMN     "offerType" "OfferType" NOT NULL DEFAULT 'VOUCHER',
ADD COLUMN     "partnerId" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "region" TEXT,
ADD COLUMN     "requiresFamilyMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresTicket" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stock" INTEGER,
ADD COLUMN     "subsidyAmount" DECIMAL(10,2),
ADD COLUMN     "subsidyEnd" TIMESTAMP(3),
ADD COLUMN     "subsidyStart" TIMESTAMP(3),
ADD COLUMN     "unpublishedAt" TIMESTAMP(3),
ADD COLUMN     "validFrom" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "customDomain" TEXT,
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "maxFamilyMembers" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "welcomeMessage" TEXT;

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "websiteUrl" TEXT,
    "notes" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'DRAFT',
    "scopeType" "PartnerScope" NOT NULL DEFAULT 'CSE',
    "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "apiBaseUrl" TEXT,
    "apiKeyEncrypted" TEXT,
    "apiFormat" TEXT,
    "syncFrequencyH" INTEGER NOT NULL DEFAULT 24,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "organizationIds" TEXT[],
    "partnerToken" TEXT,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "flaggedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_sync_logs" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "offersCreated" INTEGER NOT NULL DEFAULT 0,
    "offersUpdated" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "errorDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_audit_entries" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "partnerId" TEXT,
    "action" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partners_partnerToken_key" ON "partners"("partnerToken");

-- AddForeignKey
ALTER TABLE "benefit_catalog_items" ADD CONSTRAINT "benefit_catalog_items_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_sync_logs" ADD CONSTRAINT "partner_sync_logs_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_audit_entries" ADD CONSTRAINT "offer_audit_entries_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "benefit_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_audit_entries" ADD CONSTRAINT "offer_audit_entries_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
