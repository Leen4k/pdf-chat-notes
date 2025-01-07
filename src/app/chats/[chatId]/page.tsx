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
import { Loader2, Users, X } from "lucide-react";
import { getRandomColor } from "@/lib/utils";

// Ensure PDF.js worker is loaded
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const PDFViewer = () => {
  const { chatId: id } = useParams();
  const searchParams = useSearchParams();
  const pdfUrl = searchParams.get("pdfUrl");

  const [isInitializing, setIsInitializing] = useState(true);
  const [initialContent, setInitialContent] = useState("");
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Load initial content only once
  useEffect(() => {
    const loadInitialContent = async () => {
      if (!id) return;

      try {
        const response = await axios.get(`/api/editor?chatId=${id}`);
        const content = response.data.data?.content || "";
        setInitialContent(content);
      } catch (error) {
        console.error("Failed to load initial content:", error);
        setInitialContent("");
      } finally {
        setIsInitializing(false);
      }
    };

    loadInitialContent();
  }, [id]);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const handleLoadError = (error: Error) => {
    console.error("PDF Load Error:", error);
    setError("Failed to load PDF. Check console for details.");
  };

  if (!id) {
    return <div>Invalid chat ID</div>;
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen w-screen flex-1">
        <Loader2 className="h-8 w-8 animate-spin m-auto" />
      </div>
    );
  }

  return (
    <RoomProvider
      id={id}
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
        avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${Math.random()}`,
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
