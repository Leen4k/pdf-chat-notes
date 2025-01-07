import { db } from "@/lib/db";
import { chats, collaborations } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get chat and its collaboration status
    const [chat] = await db
      .select({
        id: chats.id,
        userId: chats.userId,
        isCollaborative: chats.isCollaborative,
      })
      .from(chats)
      .where(eq(chats.id, parseInt(params.chatId)))
      .execute();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Get all collaborators for this chat
    const collaborators = await db
      .select()
      .from(collaborations)
      .where(eq(collaborations.chatId, parseInt(params.chatId)));

    // Get user details from Clerk
    const userIds = collaborators.map((c) => c.userId);
    const userPromises = userIds.map((id) =>
      clerkClient.users.getUser(id).catch((error) => {
        console.error(`Error fetching user ${id}:`, error);
        return null;
      })
    );

    const users = (await Promise.all(userPromises)).filter(
      (user): user is NonNullable<typeof user> => user !== null
    );

    const enrichedCollaborators = collaborators.map((collab) => {
      const user = users.find((u) => u.id === collab.userId);

      return {
        id: collab.userId,
        name: user?.firstName ?? "Unknown User",
        email: user?.emailAddresses[0]?.emailAddress ?? "No email",
        imageUrl: user?.imageUrl ?? "",
        isOwner: collab.role === "owner",
        role: collab.role,
        isActive: collab.isActive,
        lastActiveAt: collab.lastActiveAt,
      };
    });

    return NextResponse.json({
      isCollaborative: chat.isCollaborative,
      isOwner: chat.userId === userId,
      collaborators: enrichedCollaborators,
    });
  } catch (error) {
    console.error("Error fetching collaboration status:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
