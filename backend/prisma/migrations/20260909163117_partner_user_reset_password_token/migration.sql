-- AlterTable
ALTER TABLE "partner_users" ADD COLUMN     "resetPasswordExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "partner_users_resetPasswordToken_key" ON "partner_users"("resetPasswordToken");
