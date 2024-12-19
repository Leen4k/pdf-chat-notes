import { db } from "@/lib/db";
import { editorContent } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, chatId } = await req.json();

    // Check if content already exists for this chat
    const existing = await db
      .select()
      .from(editorContent)
      .where(eq(editorContent.chatId, chatId));

    if (existing.length > 0) {
      // Update existing content
      const [updated] = await db
        .update(editorContent)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(editorContent.chatId, chatId))
        .returning();
      return NextResponse.json({ data: updated });
    }

    // Create new content
    const [created] = await db
      .insert(editorContent)
      .values({
        chatId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ data: created });
  } catch (error) {
    console.error("Error saving editor content:", error);
    return NextResponse.json(
      { error: "Failed to save editor content" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const content = await db
      .select()
      .from(editorContent)
      .where(eq(editorContent.chatId, parseInt(chatId)));

    return NextResponse.json({ data: content[0] || null });
  } catch (error) {
    console.error("Error fetching editor content:", error);
    return NextResponse.json(
      { error: "Failed to fetch editor content" },
      { status: 500 }
    );
  }
}
