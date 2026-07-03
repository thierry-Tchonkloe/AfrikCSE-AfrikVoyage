-- CreateEnum
CREATE TYPE "GroupTravelStatus" AS ENUM ('DRAFT', 'OPEN', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('INVITED', 'CONFIRMED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "travel_requests" ADD COLUMN     "groupTravelId" TEXT,
ADD COLUMN     "policyId" TEXT;

-- CreateTable
CREATE TABLE "travel_policies" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxFlightBudget" DECIMAL(10,2),
    "maxHotelBudgetPerNight" DECIMAL(10,2),
    "maxDailyAllowance" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "allowedFlightClass" TEXT,
    "maxAdvanceBookingDays" INTEGER,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalThreshold" DECIMAL(10,2),
    "allowedDestinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "restrictedDestinations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "appliesToDepartments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_travels" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "destination" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "estimatedCost" DECIMAL(10,2),
    "maxParticipants" INTEGER,
    "status" "GroupTravelStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_travels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_travel_participants" (
    "id" TEXT NOT NULL,
    "groupTravelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'INVITED',
    "note" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "group_travel_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_rewards" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "travelRequestId" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'EARNED',
    "estimatedCost" DECIMAL(10,2),
    "actualCost" DECIMAL(10,2),
    "savedAmount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "travel_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_scans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "rawText" TEXT,
    "extractedData" JSONB,
    "status" "OcrStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "expenseReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_scans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_travel_participants_groupTravelId_userId_key" ON "group_travel_participants"("groupTravelId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "travel_rewards_travelRequestId_key" ON "travel_rewards"("travelRequestId");

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "travel_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_requests" ADD CONSTRAINT "travel_requests_groupTravelId_fkey" FOREIGN KEY ("groupTravelId") REFERENCES "group_travels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_policies" ADD CONSTRAINT "travel_policies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_travels" ADD CONSTRAINT "group_travels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_travels" ADD CONSTRAINT "group_travels_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_travel_participants" ADD CONSTRAINT "group_travel_participants_groupTravelId_fkey" FOREIGN KEY ("groupTravelId") REFERENCES "group_travels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_travel_participants" ADD CONSTRAINT "group_travel_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_rewards" ADD CONSTRAINT "travel_rewards_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_rewards" ADD CONSTRAINT "travel_rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_rewards" ADD CONSTRAINT "travel_rewards_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "travel_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_scans" ADD CONSTRAINT "ocr_scans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_scans" ADD CONSTRAINT "ocr_scans_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
