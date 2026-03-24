CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"customer_id" text,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"mode" text DEFAULT 'hourly',
	"guest_name" text,
	"guest_phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"category" text DEFAULT 'guest' NOT NULL,
	"internal_tag" text,
	"internal_note" text,
	"note" text,
	"adults" integer DEFAULT 2,
	"food_items" jsonb DEFAULT '[]'::jsonb,
	"total_price" integer DEFAULT 0 NOT NULL,
	"voucher" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "status_check" CHECK ("bookings"."status" IN ('pending','confirmed','checked-in','checked-out','cancelled')),
	CONSTRAINT "category_check" CHECK ("bookings"."category" IN ('guest','internal'))
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text NOT NULL,
	"district" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "food_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"image" text,
	"category" text DEFAULT 'item' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_log" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"event_type" text NOT NULL,
	"guest_name" text,
	"room_id" text,
	"status" text NOT NULL,
	"message_content" text,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "notification_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_templates_event_type_unique" UNIQUE("event_type")
);
--> statement-breakpoint
CREATE TABLE "promo_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"discount_type" text NOT NULL,
	"discount_value" integer NOT NULL,
	"applicable_room_types" jsonb DEFAULT '[]'::jsonb,
	"max_uses" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "promo_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"branch_id" text,
	"description" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"max_guests" integer DEFAULT 2,
	"amenities" jsonb DEFAULT '[]'::jsonb,
	"hourly_rate" integer NOT NULL,
	"daily_rate" integer NOT NULL,
	"overnight_rate" integer NOT NULL,
	"extra_hour_rate" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"bot_token" text DEFAULT '' NOT NULL,
	"chat_id" text DEFAULT '' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"display_name" text,
	"email" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookings_room_date" ON "bookings" USING btree ("room_id","date");--> statement-breakpoint
CREATE INDEX "idx_bookings_date" ON "bookings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_bookings_customer" ON "bookings" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_status" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_customers_phone" ON "customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_notif_log_time" ON "notification_log" USING btree ("timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_promos_code" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_rooms_branch" ON "rooms" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "idx_rooms_type" ON "rooms" USING btree ("type");