CREATE TABLE IF NOT EXISTS "FdxAuditEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "category" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "requestId" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "payload" JSONB NOT NULL,
  "signature" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FdxAuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FdxAuditEvent_userId_idx" ON "FdxAuditEvent"("userId");
CREATE INDEX IF NOT EXISTS "FdxAuditEvent_category_action_idx" ON "FdxAuditEvent"("category", "action");
CREATE INDEX IF NOT EXISTS "FdxAuditEvent_resourceType_resourceId_idx" ON "FdxAuditEvent"("resourceType", "resourceId");
CREATE INDEX IF NOT EXISTS "FdxAuditEvent_createdAt_idx" ON "FdxAuditEvent"("createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'FdxAuditEvent_userId_fkey'
  ) THEN
    ALTER TABLE "FdxAuditEvent"
      ADD CONSTRAINT "FdxAuditEvent_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
