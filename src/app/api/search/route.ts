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
    const similarity = sql<number>`1 - (${
      fileChunks.embedding
    }::vector <=> ${JSON.stringify(queryEmbedding)}::vector)`;

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
        and(eq(chats.userId, userId), ilike(fileChunks.content, `%${query}%`))
      )
      .orderBy(desc(similarity))
      .limit(10); // Increased limit for better context

    // Group results by file and process
    const fileGroups = similarChunks.reduce((acc, chunk) => {
      if (!acc[chunk.fileId]) {
        acc[chunk.fileId] = {
          fileId: chunk.fileId,
          fileName: chunk.fileName,
          fileUrl: chunk.fileUrl,
          chatId: chunk.chatId,
          chunks: [],
          totalMatches: 0,
          bestSimilarity: 0,
        };
      }
      acc[chunk.fileId].chunks.push(chunk);
      acc[chunk.fileId].bestSimilarity = Math.max(
        acc[chunk.fileId].bestSimilarity,
        chunk.similarity
      );
      return acc;
    }, {} as Record<string, any>);

    // Process each file's chunks
    const results = Object.values(fileGroups).map((fileGroup) => {
      let totalMatches = 0;
      let combinedContent = "";

      // Process chunks to create a combined content with context
      fileGroup.chunks.forEach((chunk: any) => {
        const content = chunk.content;
        const matches = (
          content.toLowerCase().match(new RegExp(query.toLowerCase(), "g")) ||
          []
        ).length;
        totalMatches += matches;

        // Get surrounding context (about 100 chars before and after match)
        const matchIndex = content.toLowerCase().indexOf(query.toLowerCase());
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 100);
          const end = Math.min(content.length, matchIndex + query.length + 100);
          let contextContent = content.slice(start, end);

          // Add ellipsis if we truncated the content
          if (start > 0) contextContent = "..." + contextContent;
          if (end < content.length) contextContent += "...";

          // Highlight the match
          const highlightedContent = contextContent.replace(
            new RegExp(query, "gi"),
            (match: string) =>
              `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
          );

          combinedContent +=
            (combinedContent ? " ... " : "") + highlightedContent;
        }
      });

      return {
        fileId: fileGroup.fileId,
        fileName: fileGroup.fileName,
        fileUrl: fileGroup.fileUrl,
        chatId: fileGroup.chatId,
        content: combinedContent,
        matches: totalMatches,
        similarity: fileGroup.bestSimilarity,
      };
    });

    return NextResponse.json({
      results: results
        .filter((r) => r.similarity > 0.3)
        .sort((a, b) => b.matches - a.matches || b.similarity - a.similarity),
      query,
      totalMatches: results.reduce((acc, r) => acc + r.matches, 0),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
