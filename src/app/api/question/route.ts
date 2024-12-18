import { findSimilarChunks } from "@/lib/gemini";
import { chatSession } from "@/lib/gemini-model";
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
    const prompt = `For question: ${questionQuery}, answer the question based on the following context: ${results
      .map((result) => result.text)
      .join("\n")}`;
    const result = await chatSession.sendMessage(prompt);
    return NextResponse.json({
      status: "success",
      data: result.response.text(),
    });
  } catch (error) {
    console.error("Error in question endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
