/*
  Warnings:

  - You are about to alter the column `key` on the `idempotency_records` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `route` on the `idempotency_records` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `organizationId` on the `idempotency_records` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `status` on the `idempotency_records` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(16)`.
  - Added the required column `lease` to the `idempotency_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaseExpiresAt` to the `idempotency_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestHash` to the `idempotency_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "idempotency_records" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lease" VARCHAR(36) NOT NULL,
ADD COLUMN     "leaseExpiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "requestHash" CHAR(64) NOT NULL,
ADD COLUMN     "responseContentType" VARCHAR(255),
ADD COLUMN     "responseEncoding" VARCHAR(8),
ADD COLUMN     "responseText" TEXT,
ALTER COLUMN "key" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "route" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "organizationId" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(16);

-- CreateIndex
CREATE INDEX "idempotency_records_expiresAt_idx" ON "idempotency_records"("expiresAt");

-- CreateIndex
CREATE INDEX "idempotency_records_createdAt_idx" ON "idempotency_records"("createdAt");

-- CreateIndex
CREATE INDEX "idempotency_records_status_leaseExpiresAt_idx" ON "idempotency_records"("status", "leaseExpiresAt");
