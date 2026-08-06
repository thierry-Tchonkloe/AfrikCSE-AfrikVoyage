-- AlterTable
ALTER TABLE "benefit_requests" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "cse_posts" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "expense_reports" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "idempotencyKey" TEXT;

-- AlterTable (ajout en 3 temps : la table a des lignes existantes, donc pas de
-- NOT NULL direct sans backfill)
ALTER TABLE "poll_votes" ADD COLUMN     "postId" TEXT;
UPDATE "poll_votes" pv
  SET "postId" = po."postId"
  FROM "poll_options" po
  WHERE po.id = pv."pollOptionId";
ALTER TABLE "poll_votes" ALTER COLUMN "postId" SET NOT NULL;

-- AlterTable
ALTER TABLE "travel_requests" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "benefit_requests_idempotencyKey_key" ON "benefit_requests"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "cse_posts_idempotencyKey_key" ON "cse_posts"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "expense_reports_idempotencyKey_key" ON "expense_reports"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversationId_senderId_idempotencyKey_key" ON "messages"("conversationId", "senderId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "poll_votes_postId_userId_key" ON "poll_votes"("postId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "travel_requests_idempotencyKey_key" ON "travel_requests"("idempotencyKey");
