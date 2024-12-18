import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromSupabase } from "./DownloadFromSupabase";



const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

const indexName = "ai-pdf";

pc.createIndex({
  name: indexName,
  dimension: 2,
  metric: "cosine",
  spec: {
    serverless: {
      cloud: "aws",
      region: "us-east-1",
    },
  },
});

// export async function pdfToPinecone() {
//   //1. get the file, download it and read it from the pdf
//   // we need to pass in the file path and the local folder that we wanted to save it
//   await downloadFromSupabase(
//     "public/01. Micro architecture.pdf",
//     "testing_folder"
//   );
//   const loader = new WebPDFLoader("path...", {
//     splitPages: false,
//   });
//   const docs = await loader.load();
// }
