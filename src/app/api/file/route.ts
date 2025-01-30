import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Adjust the import path to your database connection

import { eq, and, asc } from "drizzle-orm";
import { fileChunks, files } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  try {
    // Extract chatId from the query parameters
    const searchParams = req.nextUrl.searchParams;
    const chatId = searchParams.get("chatId");

    // Validate chatId
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Fetch files for the specific chatId
    const chatFiles = await db
      .select()
      .from(files)
      .where(
        and(
          eq(files.chatId, parseInt(chatId)),
          eq(files.isDeleted, false) // Add this condition for `isDeleted`
        )
      )
      .orderBy(asc(files.name));

    // Return the files
    return NextResponse.json({
      pdf: chatFiles.map((file) => ({
        id: file.id.toString(), // Convert to string to match the type in the frontend
        pdfName: file.name,
        pdfUrl: file.url,
        createdAt: file.createdAt.toISOString(),
        isSelected: file.isSelected,
        chatId,
      })),
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching chat files:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat files" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Extract fileId from the request body
    const { fileId } = await req.json();

    // Validate fileId
    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // First, find the file to get its URL for blob deletion
    const [fileToDelete] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId));

    if (!fileToDelete) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete associated file chunks first
    await db.delete(fileChunks).where(eq(fileChunks.fileId, fileId));

    // Delete the file from the database
    const [deletedFile] = await db
      .delete(files)
      .where(eq(files.id, fileId))
      .returning();

    return NextResponse.json({
      status: 200,
      message: "File deleted successfully",
      deletedFile,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
