// app/api/chat-auth/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats, collaborations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");
  const userId = searchParams.get("userId");

  // Add more detailed error logging
  console.log("Auth check requested for:", { chatId, userId });

  if (!chatId || !userId) {
    console.log("Missing parameters:", { chatId, userId });
    return new NextResponse("Missing required parameters", { status: 400 });
  }

  try {
    const parsedChatId = parseInt(chatId);
    if (isNaN(parsedChatId)) {
      console.log("Invalid chatId:", chatId);
      return new NextResponse("Invalid chat ID", { status: 400 });
    }

    // Get the chat details
    const [chatDetails] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, parsedChatId))
      .limit(1);

    console.log("Chat details found:", chatDetails);

    if (!chatDetails) {
      return new NextResponse("Chat not found", { status: 404 });
    }

    // If user is the owner, allow access
    if (chatDetails.userId === userId) {
      return new NextResponse(null, { status: 200 });
    }

    // If chat is not collaborative and user is not the owner, deny access
    if (!chatDetails.isCollaborative) {
      return new NextResponse("Access denied", { status: 403 });
    }

    // Check if user is a collaborator
    const [collaboration] = await db
      .select()
      .from(collaborations)
      .where(
        and(
          eq(collaborations.chatId, parsedChatId),
          eq(collaborations.userId, userId),
          eq(collaborations.isActive, true)
        )
      )
      .limit(1);

    if (!collaboration) {
      return new NextResponse("Access denied", { status: 403 });
    }
    console.log("Received params:", { chatId, userId });
    console.log("Chat details:", chatDetails);
    console.log("Collaboration:", collaboration);
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Auth check error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
