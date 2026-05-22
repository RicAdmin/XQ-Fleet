-- Admin Module Phase 2 — Promos
-- Extends `promos` with new columns and adds `promo_redemptions`.
-- Legacy columns `title` and `discount` are kept temporarily; a follow-up
-- migration will drop them.

CREATE TYPE "public"."promo_discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint

ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "code" text;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "discount_type" "promo_discount_type" DEFAULT 'percent' NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "discount_value_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "max_redemptions" integer;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "redemptions_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "per_user_limit" integer;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "min_booking_amount_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "applicable_car_categories" car_category[] DEFAULT ARRAY[]::car_category[] NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "stackable_with_affiliate" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "promos" ADD COLUMN IF NOT EXISTS "created_by_user_id" text;--> statement-breakpoint

-- Backfill: code mirrors title (uppercased) so existing rows have a valid code.
UPDATE "promos" SET "code" = upper("title") WHERE "code" IS NULL;--> statement-breakpoint

-- Backfill: discountValueSen = discount % * 1 (whole percent) for legacy rows.
UPDATE "promos" SET "discount_value_sen" = ROUND("discount")::int WHERE "discount_value_sen" = 0;--> statement-breakpoint

-- Backfill: max_redemptions = NULL means unlimited, but for legacy `usage_left` we map to max+used.
UPDATE "promos" SET "max_redemptions" = "usage_left" + "redemptions_used" WHERE "max_redemptions" IS NULL AND "usage_left" > 0;--> statement-breakpoint

ALTER TABLE "promos" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "promos_code_unique" ON "promos" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promos_active_idx" ON "promos" USING btree ("is_active");--> statement-breakpoint

ALTER TABLE "promos" ADD CONSTRAINT "promos_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "promo_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promo_id" uuid NOT NULL,
  "rental_id" uuid NOT NULL,
  "customer_id" uuid,
  "user_id" text,
  "customer_email" text,
  "amount_discounted_sen" integer NOT NULL,
  "redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "promo_redemptions_rental_id_unique" UNIQUE("rental_id")
);--> statement-breakpoint

ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_promo_id_promos_id_fk" FOREIGN KEY ("promo_id") REFERENCES "public"."promos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "promo_redemptions_promo_idx" ON "promo_redemptions" USING btree ("promo_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promo_redemptions_user_idx" ON "promo_redemptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "promo_redemptions_email_idx" ON "promo_redemptions" USING btree ("customer_email");
