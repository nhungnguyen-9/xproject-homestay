ALTER TABLE "users" ADD COLUMN "permissions" jsonb DEFAULT '["bookings"]'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;