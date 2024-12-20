import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  integer,
  pgEnum,
  vector,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const userSystemEnum = pgEnum("user_system_enum", ["system", "user"]);

// Chat represents a conversation session
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar("user_id", { length: 256 }).notNull(), // Clerk user ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  gradientId: integer("gradient_id"),
});

// Files uploaded by users
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  fileKey: text("file_key").notNull(),
  isSelected: boolean("is_selected").default(false).notNull(),
  fileType: text("file_type").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  size: integer("size"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// File chunks with embeddings
export const fileChunks = pgTable(
  "file_chunks",
  {
    id: serial("id").primaryKey(),
    fileId: integer("file_id")
      .references(() => files.id)
      .notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    embeddingIndex: index("embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

export const trashItems = pgTable("trash_items", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id")
    .references(() => files.id, { onDelete: "cascade" }) // Add onDelete: 'cascade'
    .notNull(),
  originalFileData: text("original_file_data").notNull(),
  deletedAt: timestamp("deleted_at").notNull().defaultNow(),
  restoreExpiresAt: timestamp("restore_expires_at").notNull(),
  isRestored: boolean("is_restored").default(false).notNull(),
});

// Add this new table for editor content
export const editorContent = pgTable("editor_content", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
