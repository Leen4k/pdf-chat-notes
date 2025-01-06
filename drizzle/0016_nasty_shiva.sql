ALTER TABLE "collaborations" ADD COLUMN "role" varchar(50) DEFAULT 'viewer' NOT NULL;--> statement-breakpoint
ALTER TABLE "collaborations" ADD COLUMN "invited_by" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "collaborations" ADD COLUMN "invited_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "collaborations" ADD COLUMN "last_active_at" timestamp;