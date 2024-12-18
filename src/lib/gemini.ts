import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { chats, fileChunks, files } from "./db/schema";
import { db } from "./db";
import { cosineDistance, desc, eq, gt, sql, and } from "drizzle-orm";

export const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
  model: "text-embedding-004", // 768 dimensions
  taskType: TaskType.RETRIEVAL_DOCUMENT,
  title: "Document title",
});

export async function processAndStoreEmbeddings(
  chunks: string[],
  pdfName: string,
  pdfUrl: string,
  userId: string,
  fileKey: string,
  size: number
) {
  try {
    // First create the chat
    const [chat] = await db
      .insert(chats)
      .values({
        name: pdfName,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: chats.id });

    // Then create the file
    const [file] = await db
      .insert(files)
      .values({
        chatId: chat.id,
        name: pdfName,
        url: pdfUrl,
        fileKey,
        fileType: "pdf",
        isSelected: true,
        size,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: files.id });

    // Finally store chunks with embeddings
    const embeddingPromises = chunks.map(async (chunk) => {
      const embedding = await embeddings.embedQuery(chunk);

      const result = await db
        .insert(fileChunks)
        .values({
          fileId: file.id,
          content: chunk,
          embedding,
          createdAt: new Date(),
        })
        .returning({ id: fileChunks.id });

      return result[0].id;
    });

    const storedIds = await Promise.all(embeddingPromises);

    return {
      success: true,
      storedIds: [chat.id], // Return chat ID for consistency with existing code
      totalChunks: storedIds.length,
    };
  } catch (error) {
    console.error("Error processing embeddings:", error);
    throw new Error("Failed to process and store embeddings");
  }
}

// export async function findSimilarChunks(
//   searchQuery: string,
//   userId?: string,
//   threshold = 0.5,
//   limit = 4
// ) {
//   const embeddings = new GoogleGenerativeAIEmbeddings({
//     apiKey: process.env.GEMINI_API_KEY,
//     model: "text-embedding-004",
//     taskType: TaskType.RETRIEVAL_DOCUMENT,
//     title: "Document title",
//   });

//   try {
//     const queryEmbedding = await embeddings.embedQuery(searchQuery);
//     const similarity = sql<number>`1 - (${cosineDistance(
//       fileChunks.embedding,
//       queryEmbedding
//     )})`;

//     const similarChunks = await db
//       .select({
//         text: fileChunks.content,
//         pdfName: files.name,
//         pdfUrl: files.url,
//         similarity: similarity,
//       })
//       .from(fileChunks)
//       .innerJoin(files, eq(files.id, fileChunks.fileId))
//       .where(gt(similarity, 0.5))
//       .orderBy(desc(similarity))
//       .limit(limit);

//     return similarChunks;
//   } catch (error) {
//     console.error("Error finding similar chunks:", error);
//     throw new Error("Failed to find similar chunks");
//   }
// }

export async function findSimilarChunks(
  searchQuery: string,
  chatId: number,
  userId?: string,
  threshold = 0.5,
  limit = 4
) {
  try {
    const queryEmbedding = await embeddings.embedQuery(searchQuery);
    const similarity = sql<number>`1 - (${cosineDistance(
      fileChunks.embedding,
      queryEmbedding
    )})`;

    const similarChunks = await db
      .select({
        text: fileChunks.content,
        pdfName: files.name,
        pdfUrl: files.url,
        similarity: similarity,
      })
      .from(fileChunks)
      .innerJoin(files, eq(files.id, fileChunks.fileId))
      .where(
        and(
          gt(similarity, threshold),
          eq(files.chatId, chatId),
          eq(files.isSelected, true),
          eq(files.isDeleted, false)
        )
      )
      .orderBy(desc(similarity))
      .limit(limit);

    return similarChunks;
  } catch (error) {
    console.error("Error finding similar chunks:", error);
    throw new Error("Failed to find similar chunks");
  }
}
