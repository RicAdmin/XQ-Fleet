DO $$ BEGIN
  CREATE TYPE "public"."staff_profile" AS ENUM('customer_service', 'operations');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff_profile" "staff_profile";

DO $$ BEGIN
  CREATE TYPE "public"."pickup_location_kind" AS ENUM('office', 'airport', 'jetty', 'hotel', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "pickup_locations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "label" text NOT NULL,
  "kind" "pickup_location_kind" DEFAULT 'custom' NOT NULL,
  "delivery_fee_sen" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "pickup_locations_code_idx" ON "pickup_locations" USING btree ("code");
CREATE INDEX IF NOT EXISTS "pickup_locations_active_idx" ON "pickup_locations" USING btree ("is_active");
