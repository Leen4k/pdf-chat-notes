import { softDeleteFile } from "@/actions/deleteFile";
import { NextRequest, NextResponse } from "next/server";
import Error from "next/error";
import { db } from "@/lib/db";
import { files, trashItems } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    // Extract chatId from the query parameters
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "chatId is required", status: 400 },
        { status: 400 }
      );
    }

    // Perform a join between trashItems and files, filtered by chatId
    const trash = await db
      .select({
        trashItemId: trashItems.id,
        fileId: trashItems.fileId,
        restoreExpiresAt: trashItems.restoreExpiresAt,
        isRestored: trashItems.isRestored,
        fileName: files.name, // Assuming "name" is the column for the file name in the files table
      })
      .from(trashItems)
      .leftJoin(files, eq(trashItems.fileId, files.id)) // Join condition
      .where(
        and(
          eq(files.chatId, parseInt(chatId)), // Filter by chatId
          eq(files.isDeleted, true) // Ensure it’s deleted files only
        )
      );

    return NextResponse.json({
      status: 200,
      data: trash,
    });
  } catch (err) {
    console.error("Error fetching trash items:", err);
    return NextResponse.json(
      { error: "Internal server error", status: 500 },
      { status: 500 }
    );
  }
}
