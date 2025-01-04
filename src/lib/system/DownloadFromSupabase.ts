import fs from "fs";
import { getFileUrl } from "@/utils/supabase/supabaseUpload";
import path from "path";

export async function downloadFromSupabase(fileName: string, filePath: string) {
  try {
    // const encodedFileName = encodeURIComponent(fileName);
    const url = getFileUrl("AI_PDF bucket", `public/TelAssignment5.pdf`);
    console.log(`Fetching file from URL: ${url}`);

    // Download the file using fetch API
    const response = await fetch(url);

    if (!response.ok) {
      //   throw new Error(`Failed to download file: ${response.statusText}`);
      console.log(`Failed to download file: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();

    // Convert ArrayBuffer to a typed array (e.g., Uint8Array)
    const data = new Uint8Array(buffer);

    // Ensure the directory exists
    const fullFilePath = path.join(filePath, fileName);
    const dir = path.dirname(fullFilePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save the data to the filesystem
    fs.writeFileSync(fullFilePath, data);

    console.log("File downloaded successfully!");
  } catch (error: any) {
    console.error(`Error downloading file: ${error.message}`);
    throw error;
  }
}
