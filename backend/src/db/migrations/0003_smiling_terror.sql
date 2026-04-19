ALTER TABLE "customers" ADD COLUMN "id_image_urls" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "per_minute_rate" integer DEFAULT 0 NOT NULL;