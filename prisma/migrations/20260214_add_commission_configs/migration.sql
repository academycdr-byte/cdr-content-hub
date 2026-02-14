-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "commission_configs" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "cpm_value" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commission_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "commission_configs_format_key" ON "commission_configs"("format");

-- Seed default CPM values (only if table is empty)
INSERT INTO "commission_configs" ("id", "format", "cpm_value", "updated_at")
SELECT gen_random_uuid()::text, v.format, v.cpm_value, CURRENT_TIMESTAMP
FROM (VALUES
    ('REEL', 2.0),
    ('CAROUSEL', 3.0),
    ('STATIC', 2.5),
    ('STORY', 1.5)
) AS v(format, cpm_value)
WHERE NOT EXISTS (SELECT 1 FROM "commission_configs" LIMIT 1);
