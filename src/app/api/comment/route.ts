import { chatSession } from "@/lib/llm/gemini-model";
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

Format the response in clean HTML paragraphs without visible HTML tags or bullet points.`;

    const result = await chatSession.sendMessage(prompt);
    let response = result.response.text();

    // Clean up the response
    response = response
      .trim()
      // Remove HTML annotations
      .replace(/```html/g, "")
      .replace(/```/g, "")
      // Clean up bullet points
      .replace(/•\s*/g, "")
      // Remove excessive whitespace
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s{2,}/g, " ")
      // Format paragraphs properly
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => `<p>${line.trim()}</p>`)
      .join("\n");

    return NextResponse.json({
      status: "success",
      data: response,
    });
  } catch (error) {
    console.error("Error in comment endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
