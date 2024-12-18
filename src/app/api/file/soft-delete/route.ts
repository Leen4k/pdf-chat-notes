import { softDeleteFile } from "@/actions/deleteFile";
import { NextRequest, NextResponse } from "next/server";
import Error from "next/error";

export async function POST(req: NextRequest, res: NextResponse) {
  const { fileId } = await req.json();
  try {
    softDeleteFile(fileId);
    return NextResponse.json({
      status: 201,
      data: softDeleteFile,
      message: "file has been moved to trash",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", status: 500 },
      { status: 500 }
    );
  }
}
