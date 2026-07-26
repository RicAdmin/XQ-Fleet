-- =============================================================================
-- Fleet partners & partner-sourced car models
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE "public"."partner_status" AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "contact_person" text,
  "phone" text,
  "email" text,
  "status" "partner_status" NOT NULL DEFAULT 'active',
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "partners_code_unique" ON "partners" ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partners_status_idx" ON "partners" ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partners_created_at_idx" ON "partners" ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "partner_car_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "partner_id" uuid NOT NULL REFERENCES "partners"("id") ON DELETE cascade,
  "make" text NOT NULL,
  "model" text NOT NULL,
  "category" "car_category" NOT NULL DEFAULT 'other',
  "year_from" integer,
  "year_to" integer,
  "max_units" integer NOT NULL DEFAULT 1,
  "wholesale_daily_sen" integer,
  "lead_time_hours" integer,
  "linked_car_id" uuid REFERENCES "cars"("id") ON DELETE set null,
  "is_active" boolean NOT NULL DEFAULT true,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "partner_car_models_partner_idx"
  ON "partner_car_models" ("partner_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_car_models_linked_car_idx"
  ON "partner_car_models" ("linked_car_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_car_models_active_idx"
  ON "partner_car_models" ("is_active");
