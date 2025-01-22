import { supabase } from "../../../supabase";

export async function uploadFile(
  file: File,
  bucketName: string,
  publicPath = "/public/"
) {
  try {
    const uploadPath = `${publicPath}${file.name}`;
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(uploadPath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      throw new Error(error.message); // Re-throw for easier error handling
    }

    console.log(data);
    const publicUrl = getFileUrl(bucketName, data.path);
    console.log({ ...data, publicUrl });

    return { ...data, publicUrl };
  } catch (err: any) {
    console.error(`Upload failed: ${err.message}`);
    throw err; // Re-throw for further handling if needed
  }
}

export function getFileUrl(bucketName: string, path: string) {
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  console.log(data);
  const publicUrl = data.publicUrl;
  return publicUrl;
}

// Function to sanitize filename
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[\[\]()]/g, "") // Remove brackets and parentheses
    .replace(/[^a-zA-Z0-9._-]/g, "") // Remove any other special characters
    .toLowerCase(); // Convert to lowercase for consistency
};

//   try {
//     const { data, error } = await supabase.storage
//       .from("AI_PDF bucket")
//       .upload(`/public/${fileName}`, file);
//     console.log("uploaded file: " + data);
//     // const { data, error } = await supabase.storage.listBuckets();
//     console.log(data);
//   } catch (err: any) {
//     console.log(err.message);
//   }

// async function uploadFiles(
//   files: FileList,
//   bucketName: string,
//   publicPath = "/public/"
// ) {
//   const promises = [];
//   for (const file of files) {
//     promises.push(uploadFile(file, bucketName, publicPath));
//   }

//   try {
//     const uploadResults = await Promise.all(promises);
//     console.log(`Uploaded ${uploadResults.length} files successfully.`);
//     return uploadResults; // Return array of upload data
//   } catch (err) {
//     console.error(`Error uploading files: ${err.message}`);
//     throw err; // Re-throw for further handling if needed
//   }
// }

// // Usage example (assuming acceptedFile is a File or FileList):
// if (acceptedFile instanceof File) {
//   await uploadFile(acceptedFile, "AI_PDF bucket");
// } else if (acceptedFile instanceof FileList) {
//   await uploadFiles(acceptedFile, "AI_PDF bucket");
// } else {
//   console.error("Invalid file type for upload.");
// }
