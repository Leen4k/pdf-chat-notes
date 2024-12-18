ALTER TABLE "trash_items" DROP CONSTRAINT "trash_items_file_id_files_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash_items" ADD CONSTRAINT "trash_items_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
