CREATE TYPE IF NOT EXISTS "public"."payment_mode" AS ENUM('full', 'deposit');--> statement-breakpoint
CREATE TYPE "public"."season_type" AS ENUM('Low', 'Peak', 'Super Peak');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"payment_mode" "payment_mode" DEFAULT 'full' NOT NULL,
	"deposit_amount_sen" integer DEFAULT 0 NOT NULL,
	"sandbox_mode" boolean DEFAULT true NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"discount" numeric(5, 2) NOT NULL,
	"usage_left" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_calendar" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "season_calendar_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"from_date" date NOT NULL,
	"to_date" date NOT NULL,
	"season_type" "season_type" NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "price_low_season_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "price_peak_season_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "price_super_peak_season_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "ext_hour_low_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "ext_hour_peak_and_super_peak_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "delivery_fee_airport_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "delivery_fee_hotel_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "min_rental_days" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "max_rental_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "available_for_booking" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "raw_response" jsonb;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "ipay88_trans_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "ipay88_auth_code" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "callback_source" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "pick_up_time" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "return_time" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "pick_up_location" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "return_location" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "child_seat" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "second_driver" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "base_rental_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "extra_hours_decimal" numeric(10, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "extra_charge_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "extra_rule" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "addons_total_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "delivery_fee_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "discount_amount_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "sub_total_sen" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "promos_title_unique" ON "promos" USING btree ("title");
