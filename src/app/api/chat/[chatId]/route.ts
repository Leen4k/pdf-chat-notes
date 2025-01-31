import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, desc, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { invalidateCache } from "@/lib/cache/redis";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = parseInt(params.chatId);
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId))
      .orderBy(asc(chats.name));

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: 200,
      data: chat,
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json({ error: "Failed fetch chat" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, gradientId } = await req.json();
    const chatId = parseInt(params.chatId);

    const [updatedChat] = await db
      .update(chats)
      .set({
        name,
        gradientId,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId))
      .returning();

    // Invalidate all related caches
    await Promise.all([
      invalidateCache(`user:${userId}:chats`),
      invalidateCache(`chat:${chatId}`),
      invalidateCache(`chats:${userId}:${chatId}`),
    ]);

    console.log("🗑️ Invalidated caches for chat update");

    return NextResponse.json({
      message: "Chat updated successfully",
      chat: updatedChat,
    });
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = parseInt(params.chatId);

    await db.delete(chats).where(eq(chats.id, chatId));

    // Invalidate all related caches
    await Promise.all([
      invalidateCache(`user:${userId}:chats`),
      invalidateCache(`chat:${chatId}`),
      invalidateCache(`chats:${userId}:${chatId}`),
    ]);

    console.log("🗑️ Invalidated caches for chat deletion");

    return NextResponse.json({
      message: "Chat deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}
