import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPosition } = await req.json();
    const chatId = parseInt(params.chatId);

    // Update the chat's position
    const [updatedChat] = await db
      .update(chats)
      .set({
        position: newPosition,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .returning();

    return NextResponse.json({
      message: "Chat position updated successfully",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Error updating chat position:", error);
    return NextResponse.json(
      { error: "Failed to update chat position" },
      { status: 500 }
    );
  }
} 