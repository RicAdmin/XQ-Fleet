-- =============================================================================
-- Admin Module — Phase 3: Affiliates & Attribution
-- =============================================================================
-- Adds:
--   * affiliate_type, affiliate_commission_type, affiliate_status,
--     affiliate_attribution_status enums
--   * affiliates                     — programme members
--   * affiliate_clicks               — ?ref= / /r/ landings
--   * affiliate_payout_batches       — batched cash-outs
--   * affiliate_attributions         — booking ↔ affiliate, with lifecycle
--   * rentals.affiliate_ref_code     — snapshot of the cookie code
--   * rentals.affiliate_attribution_id — FK to attribution row
-- All tables use IF NOT EXISTS / IF NOT EXISTS-style guards so this migration
-- is safe to re-run during development.

DO $$ BEGIN
  CREATE TYPE "public"."affiliate_type" AS ENUM ('individual', 'company');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."affiliate_commission_type" AS ENUM ('percent', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."affiliate_status" AS ENUM ('active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."affiliate_attribution_status" AS ENUM (
    'pending', 'earned', 'voided', 'paid'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "type" "affiliate_type" NOT NULL,
  "email" text NOT NULL,
  "code" text NOT NULL,
  "commission_type" "affiliate_commission_type" NOT NULL,
  "commission_value_sen" integer NOT NULL,
  "status" "affiliate_status" NOT NULL DEFAULT 'active',
  "payout_method" text,
  "tax_info" jsonb,
  "created_by_user_id" text REFERENCES "users"("id") ON DELETE set null,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_code_unique" ON "affiliates" ("code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "affiliates_email_unique" ON "affiliates" ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliates_status_idx" ON "affiliates" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE cascade,
  "ip_address" text,
  "user_agent" text,
  "referrer" text,
  "landing_path" text,
  "clicked_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_clicks_affiliate_idx"
  ON "affiliate_clicks" ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_clicks_clicked_at_idx"
  ON "affiliate_clicks" ("clicked_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_payout_batches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE restrict,
  "amount_sen" integer NOT NULL,
  "attribution_count" integer NOT NULL,
  "paid_at" timestamptz NOT NULL DEFAULT now(),
  "paid_by_user_id" text REFERENCES "users"("id") ON DELETE set null,
  "reference" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_payout_batches_affiliate_idx"
  ON "affiliate_payout_batches" ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_payout_batches_paid_at_idx"
  ON "affiliate_payout_batches" ("paid_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "affiliate_attributions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "affiliate_id" uuid NOT NULL REFERENCES "affiliates"("id") ON DELETE restrict,
  "user_id" text REFERENCES "users"("id") ON DELETE set null,
  "rental_id" uuid NOT NULL UNIQUE REFERENCES "rentals"("id") ON DELETE cascade,
  "clicked_at" timestamptz,
  "booked_at" timestamptz NOT NULL DEFAULT now(),
  "status" "affiliate_attribution_status" NOT NULL DEFAULT 'pending',
  "commission_sen" integer NOT NULL DEFAULT 0,
  "payout_batch_id" uuid REFERENCES "affiliate_payout_batches"("id")
    ON DELETE set null,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_attributions_affiliate_idx"
  ON "affiliate_attributions" ("affiliate_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_attributions_status_idx"
  ON "affiliate_attributions" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "affiliate_attributions_user_idx"
  ON "affiliate_attributions" ("user_id");
--> statement-breakpoint

ALTER TABLE "rentals"
  ADD COLUMN IF NOT EXISTS "affiliate_ref_code" text;
--> statement-breakpoint
ALTER TABLE "rentals"
  ADD COLUMN IF NOT EXISTS "affiliate_attribution_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "rentals"
    ADD CONSTRAINT "rentals_affiliate_attribution_id_fk"
    FOREIGN KEY ("affiliate_attribution_id")
    REFERENCES "affiliate_attributions"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
