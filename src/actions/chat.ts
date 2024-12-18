import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getChats(userId: string): Promise<any> {
  const userChats = await db
    .select({
      id: chats.id,
      name: chats.name,
    })
    .from(chats)
    .where(eq(chats.userId, userId));
  return userChats;
}
