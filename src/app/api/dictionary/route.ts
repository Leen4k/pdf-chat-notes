import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const word = searchParams.get("word");

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    // Using Free Dictionary API
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        word
      )}`
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }

    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error("Dictionary API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch definition" },
      { status: 500 }
    );
  }
}
