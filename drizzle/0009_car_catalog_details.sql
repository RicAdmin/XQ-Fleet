-- Car catalog fields from data/Car.csv (passengers, luggage, marketing, ops)

ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "meta_title" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "meta_description" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "long_description" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "highlights" text[];--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "body_type" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "passengers" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "doors" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "transmission" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "fuel_type" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "apple_car_play" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "android_auto" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "boot_capacity_l" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "boot_capacity_label" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "large_suitcases_count" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "small_carryons_count" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "combined_capacity_l" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "combined_capacity_label" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "tag_fun_adventure" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "tag_family_comfort" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "tag_small_oku" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "owned_by_fleet" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "vendor_name" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "number_of_units" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "promotional_price_sen" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "late_return_hourly_fee_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "fuel_policy" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "car_locations" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "registration_number" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "last_service_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "next_service_due_km" integer;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "notes_internal" text;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "joined_date" timestamp with time zone;--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "cars_slug_unique" ON "cars" USING btree ("slug");--> statement-breakpoint

ALTER TABLE "car_photos" ADD COLUMN IF NOT EXISTS "alt_text" text;
