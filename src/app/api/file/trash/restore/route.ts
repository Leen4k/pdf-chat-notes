import { restoreFile, softDeleteFile } from "@/actions/deleteFile";
import { NextRequest, NextResponse } from "next/server";
import Error from "next/error";

export async function POST(req: NextRequest, res: NextResponse) {
  const { fileId } = await req.json();
  try {
    await restoreFile(fileId);
    return NextResponse.json({
      status: 201,
      data: restoreFile(fileId),
      message: "file has been restored",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "Internal server error", status: 500 });
  }
}
