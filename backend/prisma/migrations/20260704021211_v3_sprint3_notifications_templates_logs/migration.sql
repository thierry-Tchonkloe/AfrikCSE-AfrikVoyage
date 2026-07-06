-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationLogStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_COMPLETED';
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'WALLET_CREDITED';
ALTER TYPE "NotificationType" ADD VALUE 'CASHBACK_CREDITED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'ORDER_CANCELLED';

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "event" "NotificationType" NOT NULL,
    "channels" "NotificationChannel"[],
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "smsBody" TEXT,
    "inAppTitle" TEXT,
    "inAppBody" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "event" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationLogStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_key" ON "notification_templates"("event");
