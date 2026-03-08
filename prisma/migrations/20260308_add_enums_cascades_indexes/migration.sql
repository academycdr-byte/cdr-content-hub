-- CreateEnum (idempotent via DO block)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
    CREATE TYPE "PostStatus" AS ENUM ('IDEA', 'SCRIPT', 'PRODUCTION', 'REVIEW', 'SCHEDULED', 'PUBLISHED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostFormat') THEN
    CREATE TYPE "PostFormat" AS ENUM ('REEL', 'CAROUSEL', 'STATIC', 'STORY');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HookCategory') THEN
    CREATE TYPE "HookCategory" AS ENUM ('QUESTION', 'STATISTIC', 'CONTRARIAN', 'STORY_HOOK', 'CHALLENGE', 'COMPETITOR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SocialPlatform') THEN
    CREATE TYPE "SocialPlatform" AS ENUM ('instagram', 'tiktok', 'youtube', 'facebook', 'twitter');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SyncStatus') THEN
    CREATE TYPE "SyncStatus" AS ENUM ('success', 'partial', 'error');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SyncTrigger') THEN
    CREATE TYPE "SyncTrigger" AS ENUM ('cron', 'webhook', 'manual');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BatchSessionStatus') THEN
    CREATE TYPE "BatchSessionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoalStatus') THEN
    CREATE TYPE "GoalStatus" AS ENUM ('active', 'achieved', 'expired');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GoalPeriod') THEN
    CREATE TYPE "GoalPeriod" AS ENUM ('monthly', 'quarterly', 'yearly', 'custom');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ResultImageType') THEN
    CREATE TYPE "ResultImageType" AS ENUM ('SCREENSHOT', 'TESTIMONIAL', 'OTHER');
  END IF;
END $$;

-- DropForeignKey (to re-add with cascade)
ALTER TABLE "batch_session_posts" DROP CONSTRAINT IF EXISTS "batch_session_posts_post_id_fkey";
ALTER TABLE "checklist_completions" DROP CONSTRAINT IF EXISTS "checklist_completions_template_id_fkey";
ALTER TABLE "commissions" DROP CONSTRAINT IF EXISTS "commissions_user_id_fkey";

-- AlterTable: batch_sessions (add timestamps + convert status)
ALTER TABLE "batch_sessions" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "batch_sessions" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'batch_sessions' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "batch_sessions" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "batch_sessions" ALTER COLUMN "status" TYPE "BatchSessionStatus" USING "status"::"BatchSessionStatus";
    ALTER TABLE "batch_sessions" ALTER COLUMN "status" SET DEFAULT 'PLANNED'::"BatchSessionStatus";
  END IF;
END $$;

-- AlterTable: checklist_completions (convert completed_items to JSONB)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checklist_completions' AND column_name = 'completed_items' AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE "checklist_completions" ALTER COLUMN "completed_items" DROP DEFAULT;
    ALTER TABLE "checklist_completions" ALTER COLUMN "completed_items" TYPE JSONB USING "completed_items"::jsonb;
    ALTER TABLE "checklist_completions" ALTER COLUMN "completed_items" SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- AlterTable: checklist_templates (convert items to JSONB)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checklist_templates' AND column_name = 'items' AND data_type != 'jsonb'
  ) THEN
    ALTER TABLE "checklist_templates" ALTER COLUMN "items" DROP DEFAULT;
    ALTER TABLE "checklist_templates" ALTER COLUMN "items" TYPE JSONB USING "items"::jsonb;
    ALTER TABLE "checklist_templates" ALTER COLUMN "items" SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- AlterTable: client_results (updatedAt)
ALTER TABLE "client_results" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: commission_configs (updatedAt)
ALTER TABLE "commission_configs" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: goals (convert period and status to enums)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'period' AND data_type = 'text'
  ) THEN
    ALTER TABLE "goals" ALTER COLUMN "period" DROP DEFAULT;
    ALTER TABLE "goals" ALTER COLUMN "period" TYPE "GoalPeriod" USING "period"::"GoalPeriod";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "goals" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "goals" ALTER COLUMN "status" TYPE "GoalStatus" USING "status"::"GoalStatus";
    ALTER TABLE "goals" ALTER COLUMN "status" SET DEFAULT 'active'::"GoalStatus";
  END IF;
END $$;

-- AlterTable: hooks (convert category to enum)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hooks' AND column_name = 'category' AND data_type = 'text'
  ) THEN
    ALTER TABLE "hooks" ALTER COLUMN "category" DROP DEFAULT;
    ALTER TABLE "hooks" ALTER COLUMN "category" TYPE "HookCategory" USING "category"::"HookCategory";
    ALTER TABLE "hooks" ALTER COLUMN "category" SET DEFAULT 'QUESTION'::"HookCategory";
  END IF;
END $$;

-- AlterTable: posts (convert format and status to enums + updatedAt)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'format' AND data_type = 'text'
  ) THEN
    ALTER TABLE "posts" ALTER COLUMN "format" DROP DEFAULT;
    ALTER TABLE "posts" ALTER COLUMN "format" TYPE "PostFormat" USING "format"::"PostFormat";
    ALTER TABLE "posts" ALTER COLUMN "format" SET DEFAULT 'REEL'::"PostFormat";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "posts" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "posts" ALTER COLUMN "status" TYPE "PostStatus" USING "status"::"PostStatus";
    ALTER TABLE "posts" ALTER COLUMN "status" SET DEFAULT 'IDEA'::"PostStatus";
  END IF;
END $$;
ALTER TABLE "posts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: result_images (convert type to enum)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'result_images' AND column_name = 'type' AND data_type = 'text'
  ) THEN
    ALTER TABLE "result_images" ALTER COLUMN "type" DROP DEFAULT;
    ALTER TABLE "result_images" ALTER COLUMN "type" TYPE "ResultImageType" USING "type"::"ResultImageType";
    ALTER TABLE "result_images" ALTER COLUMN "type" SET DEFAULT 'SCREENSHOT'::"ResultImageType";
  END IF;
END $$;

-- AlterTable: social_accounts (convert platform to enum + updatedAt)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_accounts' AND column_name = 'platform' AND data_type = 'text'
  ) THEN
    ALTER TABLE "social_accounts" ALTER COLUMN "platform" DROP DEFAULT;
    ALTER TABLE "social_accounts" ALTER COLUMN "platform" TYPE "SocialPlatform" USING "platform"::"SocialPlatform";
  END IF;
END $$;
ALTER TABLE "social_accounts" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable: sync_logs (convert platform, trigger, status to enums)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'platform' AND data_type = 'text'
  ) THEN
    ALTER TABLE "sync_logs" ALTER COLUMN "platform" TYPE "SocialPlatform" USING "platform"::"SocialPlatform";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'trigger' AND data_type = 'text'
  ) THEN
    ALTER TABLE "sync_logs" ALTER COLUMN "trigger" TYPE "SyncTrigger" USING "trigger"::"SyncTrigger";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sync_logs' AND column_name = 'status' AND data_type = 'text'
  ) THEN
    ALTER TABLE "sync_logs" ALTER COLUMN "status" TYPE "SyncStatus" USING "status"::"SyncStatus";
  END IF;
END $$;

-- AlterTable: users (updatedAt)
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "batch_session_posts_post_id_idx" ON "batch_session_posts"("post_id");
CREATE INDEX IF NOT EXISTS "batch_sessions_created_by_id_idx" ON "batch_sessions"("created_by_id");
CREATE INDEX IF NOT EXISTS "commissions_is_paid_idx" ON "commissions"("is_paid");
CREATE INDEX IF NOT EXISTS "goals_status_idx" ON "goals"("status");
CREATE INDEX IF NOT EXISTS "hooks_category_idx" ON "hooks"("category");
CREATE INDEX IF NOT EXISTS "hooks_performance_score_idx" ON "hooks"("performance_score");
CREATE INDEX IF NOT EXISTS "ideation_ideas_created_at_idx" ON "ideation_ideas"("created_at");
CREATE INDEX IF NOT EXISTS "post_metrics_social_account_id_published_at_idx" ON "post_metrics"("social_account_id", "published_at");
CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts"("status");
CREATE INDEX IF NOT EXISTS "posts_format_idx" ON "posts"("format");
CREATE INDEX IF NOT EXISTS "sync_logs_platform_idx" ON "sync_logs"("platform");
CREATE INDEX IF NOT EXISTS "sync_logs_account_id_created_at_idx" ON "sync_logs"("account_id", "created_at");

-- CreateUniqueIndex (platform + username)
CREATE UNIQUE INDEX IF NOT EXISTS "social_accounts_platform_username_key" ON "social_accounts"("platform", "username");

-- AddForeignKey (with cascades)
ALTER TABLE "batch_session_posts" ADD CONSTRAINT "batch_session_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "checklist_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ideation_ideas -> content_pillars (SetNull)
ALTER TABLE "ideation_ideas" ADD CONSTRAINT "ideation_ideas_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "content_pillars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
