import { db } from "@/lib/db";
import { files, trashItems } from "@/lib/db/schema";
import { and, eq, lte } from "drizzle-orm";

export async function softDeleteFile(fileId: number) {
  // Move file to trash
  const file = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId))
    .then((res) => res[0]);

  if (!file) throw new Error("File not found");

  // Insert into trash_items
  await db.insert(trashItems).values({
    fileId: file.id,
    originalFileData: JSON.stringify(file), // Serialize full file data
    restoreExpiresAt: new Date(Date.now() + 30 * 1000),
    // restoreExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiration
  });

  // Mark file as deleted
  await db.update(files).set({ isDeleted: true }).where(eq(files.id, fileId));
}

export async function restoreFile(fileId: number) {
  const trashItem = await db
    .select()
    .from(trashItems)
    .where(and(eq(trashItems.fileId, fileId), eq(trashItems.isRestored, false)))
    .then((res) => res[0]);

  if (!trashItem) throw new Error("File not found in trash");

  const originalFileData = JSON.parse(trashItem.originalFileData);

  // Ensure date fields are properly converted to Date objects
  if (originalFileData.createdAt) {
    originalFileData.createdAt = new Date(originalFileData.createdAt);
  }
  if (originalFileData.updatedAt) {
    originalFileData.updatedAt = new Date(originalFileData.updatedAt);
  }

  // Check if the file already exists
  const existingFile = await db
    .select()
    .from(files)
    .where(eq(files.id, originalFileData.id))
    .then((res) => res[0]);

  if (existingFile) {
    // Update existing file
    await db
      .update(files)
      .set({
        ...originalFileData,
        isDeleted: false,
      })
      .where(eq(files.id, originalFileData.id));
  } else {
    // Insert new file
    await db.insert(files).values({
      ...originalFileData,
      isDeleted: false,
    });
  }

  // Mark trash item as restored
  await db
    .update(trashItems)
    .set({ isRestored: true })
    .where(eq(trashItems.id, trashItem.id));

  // Delete trash item after successful restore
  await db.delete(trashItems).where(eq(trashItems.id, trashItem.id));
}

async function cleanupExpiredTrashItems() {
  const now = new Date();

  // Find expired trash items
  const expiredItems = await db
    .select()
    .from(trashItems)
    .where(
      and(
        lte(trashItems.restoreExpiresAt, now),
        eq(trashItems.isRestored, false)
      )
    );

  for (const item of expiredItems) {
    // Remove from trash and files tables
    await db.delete(trashItems).where(eq(trashItems.id, item.id));
    await db.delete(files).where(eq(files.id, item.fileId));
  }
}
