CREATE TYPE "public"."car_color" AS ENUM('white', 'black', 'silver', 'grey', 'red', 'blue', 'dark-blue', 'maroon', 'gold', 'beige', 'green', 'other');--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "color" SET DEFAULT 'other'::"public"."car_color";--> statement-breakpoint
ALTER TABLE "cars" ALTER COLUMN "color" SET DATA TYPE "public"."car_color" USING "color"::"public"."car_color";