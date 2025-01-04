import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { invalidateCache } from "@/lib/redis";

export async function PATCH(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { updates } = await req.json();

    // Validate updates array
    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Invalid updates format" },
        { status: 400 }
      );
    }

    // Create a SQL transaction to update all positions
    const results = await db.transaction(async (tx) => {
      const updatePromises = updates.map(({ id, position }) =>
        tx
          .update(chats)
          .set({ position, updatedAt: new Date() })
          .where(sql`id = ${id}`)
          .execute()
      );
      return Promise.all(updatePromises);
    });

    // Invalidate the cache
    await invalidateCache(`user:${userId}:chats`);

    return NextResponse.json({
      message: "Chat positions updated successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error updating chat positions:", error);
    return NextResponse.json(
      { error: "Failed to update chat positions" },
      { status: 500 }
    );
  }
} 