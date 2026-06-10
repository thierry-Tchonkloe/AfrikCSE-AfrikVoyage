-- AlterTable
ALTER TABLE "expense_reports" ADD COLUMN     "category" TEXT,
ADD COLUMN     "expenseDate" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "travelId" TEXT;

-- AddForeignKey
ALTER TABLE "expense_reports" ADD CONSTRAINT "expense_reports_travelId_fkey" FOREIGN KEY ("travelId") REFERENCES "travel_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
