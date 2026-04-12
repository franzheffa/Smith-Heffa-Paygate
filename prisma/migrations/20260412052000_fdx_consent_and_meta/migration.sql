CREATE TABLE IF NOT EXISTS "FdxConsentGrant" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "status" TEXT NOT NULL,
  "createdTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expirationTime" TIMESTAMP(3),
  "updatedTime" TIMESTAMP(3) NOT NULL,
  "durationType" TEXT NOT NULL,
  "durationPeriod" INTEGER,
  "lookbackPeriod" INTEGER,
  "parties" JSONB NOT NULL,
  "resources" JSONB NOT NULL,
  CONSTRAINT "FdxConsentGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FdxConsentRevocation" (
  "id" TEXT NOT NULL,
  "consentId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REVOKED',
  "reason" TEXT NOT NULL,
  "initiator" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FdxConsentRevocation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FdxConsentGrant_userId_idx" ON "FdxConsentGrant"("userId");
CREATE INDEX IF NOT EXISTS "FdxConsentGrant_status_idx" ON "FdxConsentGrant"("status");
CREATE INDEX IF NOT EXISTS "FdxConsentRevocation_consentId_idx" ON "FdxConsentRevocation"("consentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'FdxConsentGrant_userId_fkey'
  ) THEN
    ALTER TABLE "FdxConsentGrant"
      ADD CONSTRAINT "FdxConsentGrant_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'FdxConsentRevocation_consentId_fkey'
  ) THEN
    ALTER TABLE "FdxConsentRevocation"
      ADD CONSTRAINT "FdxConsentRevocation_consentId_fkey"
      FOREIGN KEY ("consentId") REFERENCES "FdxConsentGrant"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
