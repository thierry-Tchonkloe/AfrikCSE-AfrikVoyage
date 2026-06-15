-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_REQUEST', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'TRIP_REMINDER', 'NEW_EVENT', 'MESSAGE_RECEIVED', 'SYSTEM_UPDATE');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "link" TEXT,
ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM_UPDATE';

-- AlterTable
ALTER TABLE "travel_requests" ADD COLUMN     "tripReminderSentAt" TIMESTAMP(3);
