ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
UPDATE "enrollments" SET "status" = 'left' WHERE "left_at" is not null;--> statement-breakpoint
DROP INDEX "enrollments_active_student_key";--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_current_student_key" ON "enrollments" USING btree ("class_id","student_id") WHERE "enrollments"."status" in ('active', 'waitlisted');--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_status_check" CHECK ("enrollments"."status" in ('active', 'waitlisted', 'left'));--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_status_left_at_check" CHECK (("enrollments"."status" = 'left') = ("enrollments"."left_at" is not null));