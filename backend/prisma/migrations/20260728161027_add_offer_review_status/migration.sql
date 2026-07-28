-- CreateEnum
CREATE TYPE "OfferReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "benefit_catalog_items" ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewStatus" "OfferReviewStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT;
