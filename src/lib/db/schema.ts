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

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  gradientId: integer("gradient_id"),
  position: integer("position"),
  isCollaborative: boolean("is_collaborative").default(false),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id, { onDelete: "cascade" }) // Add cascade here
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

export const fileChunks = pgTable(
  "file_chunks",
  {
    id: serial("id").primaryKey(),
    fileId: integer("file_id")
      .references(() => files.id, { onDelete: "cascade" }) // Add cascade here
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
    .references(() => files.id, { onDelete: "cascade" })
    .notNull(),
  originalFileData: text("original_file_data").notNull(),
  deletedAt: timestamp("deleted_at").notNull().defaultNow(),
  restoreExpiresAt: timestamp("restore_expires_at").notNull(),
  isRestored: boolean("is_restored").default(false).notNull(),
});

export const editorContent = pgTable("editor_content", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id, { onDelete: "cascade" }) // Add cascade here
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const collaborations = pgTable("collaborations", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  role: varchar("role", { length: 50 }).default("viewer").notNull(),
  invitedBy: varchar("invited_by", { length: 256 }).notNull(),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
