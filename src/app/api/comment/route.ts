import { chatSession } from "@/lib/gemini-model";
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

Format your response with proper paragraphs, and if needed, use:
- Bold text with **asterisks**
- Lists with proper indentation
- Clear paragraph breaks

Keep the tone professional and ensure the response flows naturally with the original content.`;

    const result = await chatSession.sendMessage(prompt);
    let response = result.response.text();

    // Format the response
    response = response
      // Add line breaks before and after the response
      .trim()
      // Ensure proper spacing after punctuation
      .replace(/([.!?])\s*(?=\S)/g, '$1 ')
      // Remove any HTML tags that might have been generated
      .replace(/<[^>]*>/g, '')
      // Ensure proper markdown formatting
      .replace(/\*\*/g, '**')
      // Add proper spacing around lists
      .replace(/(?:\r\n|\r|\n)(?=[-*])/g, '\n\n')
      // Ensure consistent line breaks
      .replace(/\n{3,}/g, '\n\n');

    // Add a separator before the response
    const formattedResponse = `\n\n**Response:** ${response}\n`;

    return NextResponse.json({
      status: "success",
      response: formattedResponse,
    });
  } catch (error) {
    console.error("Error in comment endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
