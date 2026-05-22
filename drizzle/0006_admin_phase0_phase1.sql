-- Admin Module Phase 0 + Phase 1 foundation
-- - super_admin role
-- - audit_log table
-- - refunds table (Phase 1)
-- - rental_notes table (Phase 1)

ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'super_admin';--> statement-breakpoint

CREATE TYPE "public"."audit_action" AS ENUM(
  'create',
  'update',
  'deactivate',
  'bulk_generate',
  'booking.cancel',
  'booking.refund_request',
  'booking.note',
  'affiliate.payout'
);--> statement-breakpoint

CREATE TYPE "public"."refund_status" AS ENUM('requested', 'approved', 'rejected', 'paid');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" text,
  "actor_role" "user_role",
  "action" "audit_action" NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type", "entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "refunds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rental_id" uuid NOT NULL,
  "status" "refund_status" DEFAULT 'requested' NOT NULL,
  "amount_sen" integer NOT NULL,
  "reason" text,
  "notes" text,
  "requested_by_user_id" text,
  "processed_by_user_id" text,
  "external_ref" text,
  "requested_at" timestamp with time zone DEFAULT now() NOT NULL,
  "processed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "refunds" ADD CONSTRAINT "refunds_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_user_id_users_id_fk" FOREIGN KEY ("processed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "refunds_rental_idx" ON "refunds" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "refunds_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "rental_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "rental_id" uuid NOT NULL,
  "author_user_id" text,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "rental_notes" ADD CONSTRAINT "rental_notes_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_notes" ADD CONSTRAINT "rental_notes_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "rental_notes_rental_idx" ON "rental_notes" USING btree ("rental_id");
