import { downloadFromSupabase } from "@/lib/system/DownloadFromSupabase";
import { NextResponse } from "next/server";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  embeddings,
  findSimilarChunks,
  processAndStoreEmbeddings,
} from "@/lib/llm/gemini";
import { chats, fileChunks, files } from "@/lib/db/schema";
import { and, eq, sql, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { revalidatePath } from "next/cache";
import redis, { invalidateCache } from "@/lib/cache/redis";

async function loadPDF(url: string | URL | Request) {
  try {
    const response = await fetch(url);
    const data = await response.blob();
    const loader = new WebPDFLoader(data);
    const docs = await loader.load();

    // Sanitize and clean the text content
    let pdfTextContent = "";
    docs.forEach((doc) => {
      // Remove null bytes and invalid UTF-8 characters
      const sanitizedContent = doc.pageContent
        .replace(/\0/g, "") // Remove null bytes
        .replace(/[\uFFFD\uFFFE\uFFFF]/g, "") // Remove replacement characters
        .replace(/[^\x20-\x7E\x0A\x0D]/g, " ") // Keep only printable ASCII and newlines
        .trim();

      pdfTextContent += sanitizedContent + " ";
    });

    return pdfTextContent.trim();
  } catch (error) {
    console.error("Error loading PDF:", error);
    throw new Error("Failed to process PDF content");
  }
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

    try {
      // Use the enhanced loadPDF function
      const docs = await loadPDF(file_url);

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 20,
      });

      // Additional sanitization for chunks
      const output = await splitter.createDocuments([docs]);
      let splitterList: string[] = output.map((doc) => {
        const sanitizedContent = doc.pageContent
          .replace(/\0/g, "")
          .replace(/[\uFFFD\uFFFE\uFFFF]/g, "")
          .replace(/[^\x20-\x7E\x0A\x0D]/g, " ")
          .trim();
        return sanitizedContent;
      });

      // Filter out empty chunks
      splitterList = splitterList.filter((chunk) => chunk.length > 0);

      if (splitterList.length === 0) {
        throw new Error("No valid text content found in PDF");
      }

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
    } catch (error) {
      console.error("PDF processing error:", error);
      return NextResponse.json(
        {
          error:
            "Failed to process PDF file. The file might be corrupted or contain invalid characters.",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("Error in POST handler:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      .orderBy(chats.position);
    // .orderBy(asc(chats.updatedAt));

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
