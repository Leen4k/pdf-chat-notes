import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, newName } = await req.json();

    const [updatedFile] = await db
      .update(files)
      .set({ name: newName })
      .where(eq(files.id, parseInt(fileId)))
      .returning();

    return NextResponse.json({ 
      message: "File renamed successfully",
      file: updatedFile 
    });
  } catch (error) {
    console.error("Error renaming file:", error);
    return NextResponse.json(
      { error: "Failed to rename file" },
      { status: 500 }
    );
  }
} 