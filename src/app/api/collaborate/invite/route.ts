import { db } from "@/lib/db";
import { chats, collaborations } from "@/lib/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { User } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { chatId, email } = await req.json();

    // Find user by email in Clerk using proper error handling
    let targetUser: User;
    try {
      // Get user directly by email
      const userList = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      console.log(userList);
      if (!userList.data.length) {
        return new NextResponse("User not found", { status: 404 });
      }

      targetUser = userList.data[0];

      if (!targetUser?.id) {
        return new NextResponse("Invalid user data", { status: 400 });
      }

      // Verify email
      const primaryEmailId = targetUser.primaryEmailAddressId;
      const primaryEmail = targetUser.emailAddresses.find(
        (email) => email.id === primaryEmailId
      );

      // if (!primaryEmail?.verified) {
      //   return new NextResponse("User email not verified", { status: 400 });
      // }
    } catch (error) {
      console.error("Error fetching Clerk user:", error);
      return new NextResponse("Error looking up user", { status: 500 });
    }

    // Check if already collaborating
    const [existingCollaboration] = await db
      .select()
      .from(collaborations)
      .where(
        and(
          eq(collaborations.chatId, chatId),
          eq(collaborations.userId, targetUser.id)
        )
      )
      .execute();

    if (existingCollaboration) {
      return new NextResponse("Already collaborating", { status: 400 });
    }

    // Verify the inviter is the owner
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
      return new NextResponse("Only owners can invite users", { status: 403 });
    }

    // Add collaboration
    await db.insert(collaborations).values({
      chatId: parseInt(chatId),
      userId: targetUser.id,
      role: "viewer",
      invitedBy: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error inviting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
