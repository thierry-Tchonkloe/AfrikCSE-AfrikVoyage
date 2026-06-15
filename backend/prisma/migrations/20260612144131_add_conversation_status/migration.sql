-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'RESOLVED');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN';
