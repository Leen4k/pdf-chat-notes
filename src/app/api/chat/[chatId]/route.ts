import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCache, setCache, deleteCache } from "@/lib/redis";

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
    
    // Try cache first
    const cacheKey = `chat:${chatId}`;
    const cachedChat = await getCache(cacheKey);
    
    if (cachedChat) {
      console.log("✅ Returning cached chat:", chatId);
      return NextResponse.json({
        status: 200,
        data: cachedChat,
      });
    }

    console.log("🔍 Fetching chat from database:", chatId);
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Cache the result
    await setCache(cacheKey, chat);
    console.log("💾 Cached chat:", chatId);

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

    // Invalidate both chat and user's chats list caches
    const chatCacheKey = `chat:${chatId}`;
    const userCacheKey = `user:${userId}:chats`;
    await deleteCache([chatCacheKey, userCacheKey]);
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

    // Invalidate both chat and user's chats list caches
    const chatCacheKey = `chat:${chatId}`;
    const userCacheKey = `user:${userId}:chats`;
    await deleteCache([chatCacheKey, userCacheKey]);
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
