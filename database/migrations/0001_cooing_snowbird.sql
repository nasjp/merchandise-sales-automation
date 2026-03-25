CREATE TABLE "job_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"claimed_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_queue" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "job_queue_poll_idx" ON "job_queue" USING btree ("status","created_at");