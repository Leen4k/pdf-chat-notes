"use client";
import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams, useSearchParams } from "next/navigation";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Skeleton } from "@/components/ui/skeleton";
import TextEditor from "@/components/TextEditor";
import { motion, AnimatePresence } from "framer-motion";
import { RoomProvider } from "@/liveblocks.config";
import { editorContent } from "@/lib/db/schema";
import axios from "axios";
import { ClientSideSuspense } from "@liveblocks/react";

// Ensure PDF.js worker is loaded
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

// Add a function to generate random colors
const getRandomColor = () => {
  const colors = [
    "#E57373",
    "#F06292",
    "#BA68C8",
    "#9575CD",
    "#7986CB",
    "#64B5F6",
    "#4FC3F7",
    "#4DD0E1",
    "#4DB6AC",
    "#81C784",
    "#AED581",
    "#DCE775",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const PDFViewer = () => {
  const { chatId: id } = useParams();

  if (!id) {
    return <div>Invalid chat ID</div>;
  }

  const pdfUrl = useSearchParams().get("pdfUrl");
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Update the initial content loading
  const [initialContent, setInitialContent] = useState("");

  useEffect(() => {
    const loadInitialContent = async () => {
      try {
        const response = await axios.get(`/api/editor?chatId=${id}`);
        const content = response.data.data?.content || "";
        setInitialContent(content);
      } catch (error) {
        console.error("Failed to load initial content:", error);
        setInitialContent("");
      }
    };

    if (id) {
      loadInitialContent();
    }
  }, [id]);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const handleLoadError = (error: Error) => {
    console.error("PDF Load Error:", error);
    setError("Failed to load PDF. Check console for details.");
  };

  return (
    <RoomProvider
      id={id as string}
      initialPresence={{
        cursor: null,
        isTyping: false,
      }}
      initialStorage={{
        content: initialContent,
        version: 1,
      }}
      userInfo={{
        name: `User ${Math.floor(Math.random() * 10000)}`,
        color: getRandomColor(),
      }}
    >
      <div className="grid xl:grid-cols-2">
        {/* Text Editor Column */}
        <div className="w-full p-4 overflow-y-auto rounded-lg h-screen flex-1">
          <ClientSideSuspense fallback={<div>Loading…</div>}>
            {() => <TextEditor />}
          </ClientSideSuspense>
        </div>

        {/* PDF Viewer Column */}
        <div className="w-full p-4 overflow-y-auto h-screen">
          {error && <div className="text-red-500 p-4">{error}</div>}

          <div className="flex justify-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={pdfUrl}
                initial={{ x: 50 }}
                animate={{ x: 0 }}
                exit={{ x: -50 }}
                transition={{ duration: 0.2 }}
                className="w-[90%]"
              >
                <Document
                  file={(pdfUrl as string) || ""}
                  onLoadSuccess={handleLoadSuccess}
                  onLoadError={handleLoadError}
                  loading={
                    <div className="space-y-4">
                      <Skeleton className="h-[842px] w-full mx-auto" />
                      <Skeleton className="h-[842px] w-full mx-auto" />
                    </div>
                  }
                  className="space-y-4"
                >
                  {numPages && (
                    <>
                      {[...Array(numPages)].map((_, index) => (
                        <Page
                          key={`page_${index + 1}`}
                          pageNumber={index + 1}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          className="shadow-md mb-4 mx-auto"
                          width={595}
                        />
                      ))}
                    </>
                  )}
                </Document>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </RoomProvider>
  );
};

export default PDFViewer;
