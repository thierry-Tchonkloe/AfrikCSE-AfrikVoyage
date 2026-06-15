-- CreateEnum
CREATE TYPE "TravelStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable: convert "status" column to the new enum without dropping data
ALTER TABLE "travel_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "travel_requests" ALTER COLUMN "status" TYPE "TravelStatus" USING ("status"::text::"TravelStatus");
ALTER TABLE "travel_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable: new columns
ALTER TABLE "travel_requests" ADD COLUMN "partnerName" TEXT;
ALTER TABLE "travel_requests" ADD COLUMN "paymentLink" TEXT;
ALTER TABLE "travel_requests" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
