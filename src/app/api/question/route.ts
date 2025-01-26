import { findSimilarChunks } from "@/lib/llm/gemini/gemini";
import { chatSession } from "@/lib/llm/gemini/gemini-model";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = auth();
  console.log(userId);
  if (!userId) {
    return new NextResponse(`unauthorized ${userId}`, { status: 403 });
  }
  try {
    const { questionQuery, chatId } = await req.json();
    if (!questionQuery) {
      return new NextResponse("question query is required", { status: 400 });
    }
    const results = await findSimilarChunks(
      questionQuery,
      chatId,
      userId as string
    );
    const prompt = `For question: ${questionQuery}, please provide a concise answer based on this context: ${results
      .map((result) => result.text)
      .join(
        "\n"
      )}. Format your response in HTML using <p> tags for paragraphs and <strong> tags for emphasis. Keep formatting minimal and avoid unnecessary line breaks.`;
    const result = await chatSession.sendMessage(prompt);
    const response = result.response.text();

    // Clean up the response
    const cleanResponse = response
      .trim()
      .replace(/\n+/g, "\n")
      .replace(/\s+/g, " ")
      .replace(/<p>\s+/g, "<p>")
      .replace(/\s+<\/p>/g, "</p>");

    return NextResponse.json({
      status: "success",
      data: cleanResponse,
    });
  } catch (error) {
    console.error("Error in question endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
