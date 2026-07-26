CREATE INDEX IF NOT EXISTS "rentals_status_start_date_idx" ON "rentals" USING btree ("status","start_date");
CREATE INDEX IF NOT EXISTS "rentals_status_end_date_idx" ON "rentals" USING btree ("status","end_date");
CREATE INDEX IF NOT EXISTS "rentals_car_id_status_idx" ON "rentals" USING btree ("car_id","status");
CREATE INDEX IF NOT EXISTS "customers_created_at_idx" ON "customers" USING btree ("created_at");
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments" USING btree ("created_at");
