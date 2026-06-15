-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
ADD COLUMN     "notificationPreferences" JSONB NOT NULL DEFAULT '{"email":true,"travelAlerts":true,"cseUpdates":true,"systemUpdates":true}',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Africa/Lome';
