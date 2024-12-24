import { chatSession } from "@/lib/gemini-model";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse("unauthorized", { status: 403 });
  }

  try {
    const { word } = await req.json();
    if (!word) {
      return new NextResponse("word is required", { status: 400 });
    }

    const prompt = `Please explain the word "${word}" in a clear and concise way. Include:
    1. A brief definition
    2. The part of speech (noun, verb, etc.)
    3. A simple example of usage
    Format the response in HTML with appropriate tags.`;

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
    console.error("Error in explain endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
