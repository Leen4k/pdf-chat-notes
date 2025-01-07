import { db } from "@/lib/db";
import { chats, collaborations } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and, ne } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { chatId } = await req.json();

    // First verify user is the owner and get current collaboration status
    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .execute();

    if (!chat) {
      return NextResponse.json(
        { error: "Unauthorized or chat not found" },
        { status: 401 }
      );
    }

    // Toggle the collaboration status
    const newCollaborativeStatus = !chat.isCollaborative;

    // Update the chat's collaboration status
    await db
      .update(chats)
      .set({
        isCollaborative: newCollaborativeStatus,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .execute();

    // Update all non-owner collaborations
    await db
      .update(collaborations)
      .set({
        isActive: newCollaborativeStatus,
        updatedAt: new Date(),
      })
      .where(
        and(eq(collaborations.chatId, chatId), ne(collaborations.role, "owner"))
      )
      .execute();

    return NextResponse.json({
      success: true,
      isCollaborative: newCollaborativeStatus,
    });
  } catch (error) {
    console.error("Error toggling collaboration:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
