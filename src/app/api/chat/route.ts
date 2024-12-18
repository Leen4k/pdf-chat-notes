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
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

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

// export async function POST(req: Request, res: Response) {
//   try {
//     const { file_key, file_name, file_url } = await req.json();
//     const { userId } = auth();

//     if (!userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const docs = await loadPDF(file_url);
//     const splitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 20,
//     });
//     const output = await splitter.createDocuments([docs]);

//     let splitterList: string[] = output.map((doc) => doc.pageContent);
//     const size = docs.length;

//     const result = await processAndStoreEmbeddings(
//       splitterList,
//       file_name,
//       file_url,
//       userId,
//       file_key,
//       size
//     );

//     return NextResponse.json({
//       message: "Embeddings processed successfully!",
//       data: result,
//     });
//   } catch (err) {
//     console.log(err);
//     return NextResponse.json({ error: "internal server error", status: 500 });
//   }
// }

export async function POST(req: Request, res: Response) {
  try {
    const { file_key, file_name, file_url, chatId } = await req.json();
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      { error: "Internal server error", status: 500 },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const searchQuery = searchParams.get("search");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Query to fetch file with associated chat info
    const pdf = await db
      .select({
        id: chats.id,
        pdfName: files.name,
        pdfUrl: files.url,
        createdAt: chats.createdAt,
        fileKey: files.fileKey,
        isSelected: files.isSelected,
      })
      .from(chats)
      .leftJoin(files, eq(chats.id, files.chatId))
      .where(eq(chats.id, parseInt(chatId)));

    if (!pdf.length) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    let similarChunks = null;
    if (searchQuery) {
      similarChunks = await findSimilarChunks(searchQuery, parseInt(chatId));
    }

    return NextResponse.json({
      pdf: pdf,
      similarChunks,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
