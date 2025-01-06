import { db } from "@/lib/db";
import { chats, collaborations } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chatId, userId: targetUserId } = await req.json();

    // Verify requester is owner
    const isOwner = await db
      .select()
      .from(collaborations)
      .innerJoin(chats, eq(collaborations.chatId, chats.id))
      .where(
        and(
          eq(collaborations.chatId, chatId),
          eq(chats.userId, userId)
          // eq(collaborations.role, "owner")
        )
      )
      .execute();

    if (!isOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete collaboration
    await db
      .delete(collaborations)
      .where(
        and(
          eq(collaborations.chatId, chatId),
          eq(collaborations.userId, targetUserId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing collaborator:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
