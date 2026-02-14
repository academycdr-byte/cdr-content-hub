-- CreateTable
CREATE TABLE IF NOT EXISTS "sync_logs" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "posts_found" INTEGER NOT NULL DEFAULT 0,
    "posts_synced" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_logs_account_id_idx" ON "sync_logs"("account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_logs_platform_idx" ON "sync_logs"("platform");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "sync_logs_created_at_idx" ON "sync_logs"("created_at");

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
