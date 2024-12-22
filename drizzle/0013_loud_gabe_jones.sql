ALTER TABLE "editor_content" DROP CONSTRAINT "editor_content_chat_id_chats_id_fk";
--> statement-breakpoint
ALTER TABLE "file_chunks" DROP CONSTRAINT "file_chunks_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_chat_id_chats_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "editor_content" ADD CONSTRAINT "editor_content_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_chunks" ADD CONSTRAINT "file_chunks_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
