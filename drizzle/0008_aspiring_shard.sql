CREATE TABLE IF NOT EXISTS "file_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "messages";--> statement-breakpoint
DROP INDEX IF EXISTS "embeddingIndex";--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file_chunks" ADD CONSTRAINT "file_chunks_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "embedding_index" ON "file_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "pdf_name";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "pdf_url";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "file_key";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "text";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "embedding";