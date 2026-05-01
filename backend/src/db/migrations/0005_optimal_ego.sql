ALTER TABLE "bookings" DROP CONSTRAINT "mode_check";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "combo_6h1h_option" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "combo_3h_rate" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "combo_6h1h_rate" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "combo_6h1h_discount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "per_minute_rate";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "combo_6h1h_option_check" CHECK ("bookings"."combo_6h1h_option" IS NULL OR "bookings"."combo_6h1h_option" IN ('bonus_hour', 'discount'));--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "mode_check" CHECK ("bookings"."mode" IN ('hourly', 'daily', 'overnight', 'combo3h', 'combo6h1h'));