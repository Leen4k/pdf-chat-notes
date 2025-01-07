import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getRandomColor } from "@/lib/utils";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  // Get the authenticated user from Clerk
  const userId = auth().userId;
  const user = await currentUser();

  if (!userId || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Create a session with the Clerk user data
  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: user.firstName + " " + user.lastName || "Anonymous",
      avatar: user.imageUrl,
      color: getRandomColor(),
    },
  });

  try {
    // Get room id from request body
    const { room } = await request.json();

    if (!room) {
      return new Response("Missing room id", { status: 400 });
    }

    // Grant access to the room
    session.allow(room, session.FULL_ACCESS);

    // Authorize the session and return the response
    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Error in liveblocks auth:", error);
    return new Response("Error processing request", { status: 500 });
  }
}
