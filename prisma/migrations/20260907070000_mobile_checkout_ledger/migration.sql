CREATE TABLE IF NOT EXISTS "MobileCheckout" (
  "id" TEXT NOT NULL, "ownerUid" TEXT NOT NULL, "service" TEXT NOT NULL,
  "offerId" TEXT, "rail" TEXT NOT NULL, "currency" TEXT NOT NULL,
  "providerFareMinor" BIGINT NOT NULL, "platformTicketFeeMinor" BIGINT NOT NULL,
  "platformTransactionFeeMinor" BIGINT NOT NULL, "providerFeeMinor" BIGINT NOT NULL DEFAULT 0,
  "totalMinor" BIGINT NOT NULL, "pricingVersion" TEXT NOT NULL, "fxSource" TEXT,
  "fxRate" TEXT, "fxTimestamp" TIMESTAMP(3), "state" TEXT NOT NULL,
  "idempotencyKeyHash" TEXT NOT NULL, "providerTransactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MobileCheckout_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MobileCheckout_ownerUid_idempotencyKeyHash_key" ON "MobileCheckout"("ownerUid", "idempotencyKeyHash");
CREATE INDEX IF NOT EXISTS "MobileCheckout_ownerUid_createdAt_idx" ON "MobileCheckout"("ownerUid", "createdAt");
CREATE INDEX IF NOT EXISTS "MobileCheckout_providerTransactionId_idx" ON "MobileCheckout"("providerTransactionId");

CREATE TABLE IF NOT EXISTS "ProviderWebhookEvent" (
  "id" TEXT NOT NULL, "provider" TEXT NOT NULL, "providerEventId" TEXT NOT NULL,
  "providerTransactionId" TEXT, "internalTransactionId" TEXT, "eventType" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL, "processingStatus" TEXT NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "processedAt" TIMESTAMP(3),
  CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProviderWebhookEvent_provider_providerEventId_key" ON "ProviderWebhookEvent"("provider", "providerEventId");
CREATE INDEX IF NOT EXISTS "ProviderWebhookEvent_providerTransactionId_idx" ON "ProviderWebhookEvent"("providerTransactionId");
CREATE INDEX IF NOT EXISTS "ProviderWebhookEvent_internalTransactionId_idx" ON "ProviderWebhookEvent"("internalTransactionId");
CREATE INDEX IF NOT EXISTS "ProviderWebhookEvent_receivedAt_idx" ON "ProviderWebhookEvent"("receivedAt");
