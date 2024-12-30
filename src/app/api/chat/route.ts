import { downloadFromSupabase } from "@/lib/DownloadFromSupabase";
import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  embeddings,
  findSimilarChunks,
  processAndStoreEmbeddings,
} from "@/lib/gemini";
import { chats, fileChunks, files } from "@/lib/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { revalidatePath } from "next/cache";
import redis, { invalidateCache } from "@/lib/redis";

async function loadPDF(url: string | URL | Request) {
  //load the pdf file and get only the page content and put into one variable only
  const response = await fetch(url);
  const data = await response.blob();
  const loader = new WebPDFLoader(data);
  const docs = await loader.load();
  let pdfTextContent = "";
  docs.forEach((doc) => {
    pdfTextContent = pdfTextContent + doc.pageContent;
  });
  return pdfTextContent;
}

export async function POST(req: Request, res: Response) {
  try {
    const body = await req.json();
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If it's just creating a chat (no PDF)
    if (!body.file_key && !body.file_url) {
      const [newChat] = await db
        .insert(chats)
        .values({
          name: body.name,
          userId,
          gradientId: body.gradientId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Invalidate the user's chats cache
      await invalidateCache(`user:${userId}:chats`);

      return NextResponse.json({
        message: "Chat created successfully",
        data: newChat,
      });
    }

    // If it's creating a chat with PDF
    const { file_key, file_name, file_url, chatId } = body;

    // Use the existing loadPDF function to extract text
    const docs = await loadPDF(file_url);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 20,
    });
    const output = await splitter.createDocuments([docs]);

    let splitterList: string[] = output.map((doc) => doc.pageContent);
    const size = docs.length;

    let chatRecord;
    let fileRecord;

    // Check if chatId is provided (existing chat) or create a new chat
    if (chatId) {
      // Verify the chat exists and belongs to the user
      const existingChat = await db
        .select()
        .from(chats)
        .where(and(eq(chats.id, parseInt(chatId)), eq(chats.userId, userId)))
        .execute();

      if (existingChat.length === 0) {
        return NextResponse.json(
          { error: "Chat not found or unauthorized" },
          { status: 404 }
        );
      }

      chatRecord = { id: parseInt(chatId) };
    } else {
      // Create a new chat if no chatId is provided
      const [newChat] = await db
        .insert(chats)
        .values({
          name: file_name,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: chats.id });

      chatRecord = newChat;
    }

    // Create the file record
    const [newFile] = await db
      .insert(files)
      .values({
        chatId: chatRecord.id,
        name: file_name,
        url: file_url,
        fileKey: file_key,
        fileType: "pdf",
        isSelected: true,
        size,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: files.id });

    fileRecord = newFile;

    const embeddingPromises = splitterList.map(async (chunk) => {
      const embedding = await embeddings.embedQuery(chunk);

      const [storedChunk] = await db
        .insert(fileChunks)
        .values({
          fileId: fileRecord.id,
          content: chunk,
          embedding,
          createdAt: new Date(),
        })
        .returning({ id: fileChunks.id });

      return storedChunk.id;
    });

    const storedIds = await Promise.all(embeddingPromises);
    revalidatePath("/");
    return NextResponse.json({
      message: "Embeddings processed successfully!",
      data: {
        chatId: chatRecord.id,
        fileId: fileRecord.id,
        storedIds,
        totalChunks: storedIds.length,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// export async function GET(req: Request) {
//   // const { userId } = auth();

//   // if (!userId) {
//   //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   // }
//   const userId = "user_2iErJ4Rtg6qQ03h7FSHTrYB4XcZ";

//   try {
//     const userChats = await db
//       .select()
//       .from(chats)
//       .where(eq(chats.userId, "user_2iErJ4Rtg6qQ03h7FSHTrYB4XcZ"))
//       .orderBy(chats.position, desc(chats.updatedAt));

//     return NextResponse.json({
//       status: 200,
//       data: userChats,
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

export async function GET(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // const userId = "user_2iErJ4Rtg6qQ03h7FSHTrYB4XcZ";

  try {
    // Try to get data from Redis cache first
    const cacheKey = `user:${userId}:chats`;
    console.log("🔍 Checking cache for user chats:", cacheKey);
    const cachedChats = await redis.get(cacheKey);

    if (cachedChats) {
      console.log("✅ Cache hit! Returning cached chats");
      return NextResponse.json({
        status: 200,
        data: cachedChats,
      });
    }

    console.log("❌ Cache miss, fetching from database");
    // If no cache, fetch from database
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId))
      .orderBy(chats.position, desc(chats.updatedAt));

    // Cache the result
    console.log("💾 Caching user chats");
    await redis.set(cacheKey, userChats, {
      ex: 60 * 5, // Cache for 5 minutes
    });

    return NextResponse.json({
      status: 200,
      data: userChats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, gradientId } = await req.json();

    const [updatedChat] = await db
      .update(chats)
      .set({
        name,
        gradientId,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, id))
      .returning();

    // Invalidate all related caches
    await Promise.all([
      invalidateCache(`user:${userId}:chats`),
      invalidateCache(`chat:${id}`),
    ]);

    return NextResponse.json({
      message: "Chat updated successfully",
      data: updatedChat,
    });
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
}
