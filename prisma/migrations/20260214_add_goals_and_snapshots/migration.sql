-- CreateTable
CREATE TABLE IF NOT EXISTS "goals" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "target_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL DEFAULT 0,
    "start_value" INTEGER NOT NULL DEFAULT 0,
    "period" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "follower_snapshots" (
    "id" TEXT NOT NULL,
    "social_account_id" TEXT NOT NULL,
    "followers_count" INTEGER NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follower_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "goals_social_account_id_idx" ON "goals"("social_account_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "goals_status_idx" ON "goals"("status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "follower_snapshots_social_account_id_snapshot_date_key" ON "follower_snapshots"("social_account_id", "snapshot_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "follower_snapshots_social_account_id_idx" ON "follower_snapshots"("social_account_id");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follower_snapshots" ADD CONSTRAINT "follower_snapshots_social_account_id_fkey" FOREIGN KEY ("social_account_id") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
