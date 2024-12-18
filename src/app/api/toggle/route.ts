// app/api/file/toggle/route.ts
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { fileId, isSelected } = await req.json();

    console.log("Received toggle request:", { fileId, isSelected });

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Log the current file state before update
    const existingFile = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .execute();

    console.log("Existing file before update:", existingFile);

    // Update the file's isSelected status
    const updatedFile = await db
      .update(files)
      .set({ isSelected: isSelected })
      .where(eq(files.id, fileId))
      .returning();

    console.log("Updated file:", updatedFile[0]);

    return NextResponse.json(updatedFile[0], { status: 200 });
  } catch (error) {
    console.error("Error toggling file selection:", error);
    return NextResponse.json(
      { error: "Failed to toggle file selection" },
      { status: 500 }
    );
  }
}
