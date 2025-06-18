CREATE TABLE "events" (
	"uuid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"description" text,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"location_name" text,
	"price" numeric(10, 2) NOT NULL,
	"metadata" jsonb NOT NULL
);
