import { db } from "@/lib/db";
import { chats, fileChunks, files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { embeddings } from "@/lib/gemini";
import { eq, sql, and, ilike, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await req.json();
    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Get query embedding for semantic search
    const queryEmbedding = await embeddings.embedQuery(query);

    // Calculate similarity using PostgreSQL vector operations
    const similarity = sql<number>`1 - (${fileChunks.embedding}::vector <=> ${JSON.stringify(queryEmbedding)}::vector)`;

    // Find similar chunks with proper joins and keyword matching
    const similarChunks = await db
      .select({
        fileId: files.id,
        fileName: files.name,
        fileUrl: files.url,
        chatId: files.chatId,
        content: fileChunks.content,
        similarity,
      })
      .from(fileChunks)
      .innerJoin(files, eq(files.id, fileChunks.fileId))
      .innerJoin(chats, eq(files.chatId, chats.id))
      .where(
        and(
          eq(chats.userId, userId),
          ilike(fileChunks.content, `%${query}%`)
        )
      )
      .orderBy(desc(similarity))
      .limit(5);

    // Process results to include keyword matches and highlighting
    const results = similarChunks.map((chunk) => {
      const content = chunk.content;
      const matches = content.toLowerCase().split(query.toLowerCase()).length - 1;
      
      // Create highlighted content with context
      const words = content.split(/\s+/);
      const queryRegex = new RegExp(query, 'gi');
      const highlightedContent = content.replace(
        queryRegex,
        match => `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
      );

      return {
        fileId: chunk.fileId,
        fileName: chunk.fileName,
        fileUrl: chunk.fileUrl,
        chatId: chunk.chatId,
        content: highlightedContent,
        rawContent: content,
        matches,
        similarity: Number(chunk.similarity.toFixed(2))
      };
    });

    return NextResponse.json({
      results: results
        .filter(r => r.similarity > 0.3)
        .sort((a, b) => b.matches - a.matches || b.similarity - a.similarity),
      query,
      totalMatches: results.reduce((acc, r) => acc + r.matches, 0)
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
