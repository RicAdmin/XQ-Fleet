CREATE TYPE "public"."maintenance_event_status" AS ENUM('open', 'completed');--> statement-breakpoint
CREATE TYPE "public"."maintenance_event_type" AS ENUM('scheduled', 'unscheduled', 'damage', 'road-tax', 'insurance');--> statement-breakpoint
CREATE TABLE "car_service_config" (
	"car_id" uuid PRIMARY KEY NOT NULL,
	"service_interval_km" integer,
	"service_interval_days" integer,
	"alert_before_km" integer DEFAULT 500 NOT NULL,
	"alert_before_days" integer DEFAULT 7 NOT NULL,
	"road_tax_expiry_date" timestamp with time zone,
	"road_tax_renewal_cost_sen" integer DEFAULT 0 NOT NULL,
	"road_tax_policy_ref" text,
	"insurance_expiry_date" timestamp with time zone,
	"insurance_renewal_cost_sen" integer DEFAULT 0 NOT NULL,
	"insurance_policy_ref" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"car_id" uuid NOT NULL,
	"type" "maintenance_event_type" NOT NULL,
	"description" text NOT NULL,
	"mileage_at_service" integer,
	"cost_sen" integer DEFAULT 0 NOT NULL,
	"workshop_vendor" text,
	"status" "maintenance_event_status" DEFAULT 'open' NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"next_due_mileage" integer,
	"next_due_date" timestamp with time zone,
	"created_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cars" ADD COLUMN "current_mileage" integer;--> statement-breakpoint
ALTER TABLE "car_service_config" ADD CONSTRAINT "car_service_config_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_events_car_id_idx" ON "maintenance_events" USING btree ("car_id");--> statement-breakpoint
CREATE INDEX "maintenance_events_status_idx" ON "maintenance_events" USING btree ("status");