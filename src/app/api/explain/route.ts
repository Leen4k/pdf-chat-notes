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
    Format the response in HTML using <div> tags for sections and avoid using bullet points or list tags.`;

    const result = await chatSession.sendMessage(prompt);
    const response = result.response.text();

    // Clean up the response
    const cleanResponse = response
      .trim()
      // Convert any bullet points to paragraphs
      .replace(/•\s*(.*?)(?=(?:•|\n|$))/g, '<p>$1</p>')
      // Remove any remaining bullet characters
      .replace(/[•◦]/g, '')
      // Clean up extra spaces and line breaks
      .replace(/\s+/g, ' ')
      .replace(/<p>\s+/g, '<p>')
      .replace(/\s+<\/p>/g, '</p>')
      // Ensure proper spacing between elements
      .replace(/<\/p><p>/g, '</p>\n<p>');

    return NextResponse.json({
      status: "success",
      data: cleanResponse,
    });
  } catch (error) {
    console.error("Error in explain endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
