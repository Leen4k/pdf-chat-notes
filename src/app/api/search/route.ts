import { findSimilarChunks } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchQuery } = await req.json();
    if (!searchQuery) {
      return new NextResponse("Search query is required", { status: 400 });
    }
    const results = await findSimilarChunks(searchQuery, 1);
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in search endpoint:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
