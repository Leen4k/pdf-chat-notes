import { chatSession } from "@/lib/llm/gemini/gemini-model";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse("unauthorized", { status: 403 });
  }

  try {
    const { content, comment } = await req.json();

    const prompt = `Based on this content: "${content}"
    
Please address this comment/question: "${comment}"

Provide a clear and detailed response that directly addresses the comment/question while maintaining context with the original content.

Guidelines:
- Write in clear, concise paragraphs
- Use emphasis sparingly and naturally
- Present information in a flowing, narrative style
- Keep technical terms simple and accessible
- Maintain a professional but conversational tone
- Break complex ideas into digestible sections

Format your response in HTML using <p> tags for paragraphs and <strong> tags for emphasis. Keep formatting minimal and avoid unnecessary line breaks.`;

    const result = await chatSession.sendMessage(prompt);
    let response = result.response.text();

    // Clean up the response
    const cleanResponse = response
      .trim()
      .replace(/\n+/g, "\n")
      .replace(/\s+/g, " ")
      .replace(/<p>\s+/g, "<p>")
      .replace(/\s+<\/p>/g, "</p>")
      .replace("```html", "")
      .replace("```", "");
    return NextResponse.json({
      status: "success",
      data: cleanResponse,
    });
  } catch (error) {
    console.error("Error in comment endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
