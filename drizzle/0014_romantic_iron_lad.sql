CREATE TABLE "daily_task_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"task_id" integer NOT NULL,
	"completion_date" varchar(10) NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_dtc_user_task_date" UNIQUE("user_id","task_id","completion_date")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participant_submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" varchar(20) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phoneNumber" varchar(255),
	"media_url" text NOT NULL,
	"media_platform" varchar(20) NOT NULL,
	"status" varchar(255) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"rejected_reason" varchar(255)
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "youtube_url" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD COLUMN "is_duplicate_proof" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "user_tasks" ADD COLUMN "rejected_at" timestamp;--> statement-breakpoint
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_task_completions" ADD CONSTRAINT "daily_task_completions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_submission" ADD CONSTRAINT "participant_submission_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dtc_user_task" ON "daily_task_completions" USING btree ("user_id","task_id");--> statement-breakpoint
CREATE INDEX "idx_dtc_task_date" ON "daily_task_completions" USING btree ("task_id","completion_date");--> statement-breakpoint
CREATE INDEX "idx_dtc_user_date" ON "daily_task_completions" USING btree ("user_id","completion_date");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_participant_submission_user_id" ON "participant_submission" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_participant_submission_category" ON "participant_submission" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_participant_submission_status" ON "participant_submission" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_participant_submission_email" ON "participant_submission" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_participant_submission_created_at" ON "participant_submission" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_participant_submission_updated_at" ON "participant_submission" USING btree ("updated_at");