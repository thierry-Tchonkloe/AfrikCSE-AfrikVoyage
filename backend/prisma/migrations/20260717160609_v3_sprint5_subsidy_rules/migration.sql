-- CreateTable
CREATE TABLE "subsidy_rules" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT,
    "offerType" "OfferType",
    "subsidyPct" INTEGER,
    "subsidyAmount" DECIMAL(10,2),
    "currencyCode" TEXT NOT NULL DEFAULT 'XOF',
    "maxPerEmployee" DECIMAL(10,2),
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subsidy_rules_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subsidy_rules" ADD CONSTRAINT "subsidy_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
