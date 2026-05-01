CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "time_range" tsrange GENERATED ALWAYS AS (
  tsrange(
    (("date"::date) + ("start_time"::time))::timestamp,
    CASE
      WHEN "mode" = 'overnight' OR ("end_time"::time) <= ("start_time"::time)
      THEN (("date"::date + 1) + ("end_time"::time))::timestamp
      ELSE (("date"::date) + ("end_time"::time))::timestamp
    END,
    '[)'
  )
) STORED;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING gist (
  "room_id" WITH =,
  "time_range" WITH &&
) WHERE ("status" <> 'cancelled');
