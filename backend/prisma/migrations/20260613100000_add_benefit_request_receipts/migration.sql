-- AlterTable
ALTER TABLE "benefit_requests" ADD COLUMN     "receipts" TEXT[] DEFAULT ARRAY[]::TEXT[];
