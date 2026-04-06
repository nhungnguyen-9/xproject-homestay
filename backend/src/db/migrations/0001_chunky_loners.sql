ALTER TABLE "bookings" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "branches" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "customers" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_log" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification_templates" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "promo_codes" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "telegram_config" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_bookings_created_by" ON "bookings" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_promos_room_types" ON "promo_codes" USING gin ("applicable_room_types");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "mode_check" CHECK ("bookings"."mode" IN ('hourly', 'daily', 'overnight'));--> statement-breakpoint
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_category_check" CHECK ("food_items"."category" IN ('item', 'combo'));--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_status_check" CHECK ("notification_log"."status" IN ('sent', 'simulated', 'failed'));--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_type_check" CHECK ("rooms"."type" IN ('standard', 'vip', 'supervip'));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("users"."role" IN ('admin', 'staff'));