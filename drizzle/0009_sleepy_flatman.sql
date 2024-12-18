CREATE TABLE IF NOT EXISTS "trash_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer NOT NULL,
	"original_file_data" text NOT NULL,
	"deleted_at" timestamp DEFAULT now() NOT NULL,
	"restore_expires_at" timestamp NOT NULL,
	"is_restored" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "is_deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash_items" ADD CONSTRAINT "trash_items_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
