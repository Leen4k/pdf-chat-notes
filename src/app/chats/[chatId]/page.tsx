"use client";
import { useState, useEffect, useRef } from "react";
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
import { Loader2, Users, X, FileText, ArrowUpCircle } from "lucide-react";
import { getRandomColor } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Ensure PDF.js worker is loaded
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const PDFViewer = () => {
  const { chatId: id } = useParams();
  const searchParams = useSearchParams();
  const pdfUrl = searchParams.get("pdfUrl");
  const searchQuery = searchParams.get("searchQuery");
  const router = useRouter();

  const [isInitializing, setIsInitializing] = useState(true);
  const [initialContent, setInitialContent] = useState("");
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [highlights, setHighlights] = useState<any[]>([]);

  // Load initial content only once
  useEffect(() => {
    const loadInitialContent = async () => {
      if (!id) return;

      try {
        setIsLoadingContent(true);
        const response = await axios.get(`/api/editor?chatId=${id}`);
        const content = response.data.data?.content || "";
        setInitialContent(content);
      } catch (error) {
        console.error("Failed to load initial content:", error);
        setInitialContent("");
      } finally {
        setIsLoadingContent(false);
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

  // Function to handle text highlighting
  const highlightPattern = (text: string, pattern: string) => {
    if (!pattern) return text;
    const regex = new RegExp(`(${pattern})`, "gi");
    return text.replace(
      regex,
      '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
    );
  };

  // Custom text renderer for PDF pages
  const textRenderer = (textItem: any) => {
    if (!searchQuery) return textItem.str;
    return highlightPattern(textItem.str, searchQuery);
  };

  if (!id) {
    return <div>Invalid chat ID</div>;
  }

  if (isLoadingContent || isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen w-screen flex-1">
        <Loader2 className="h-8 w-8 animate-spin m-auto" />
      </div>
    );
  }

  return (
    <RoomProvider
      id={id as string}
      initialPresence={{
        cursor: null,
        isTyping: false,
      }}
      initialStorage={{
        content: initialContent || "",
        version: 1,
      }}
      key={id as string}
      userInfo={{
        name: `User ${Math.floor(Math.random() * 10000)}`,
        color: getRandomColor(),
        avatar: `https://api.dicebear.com/6.x/avataaars/svg?seed=${Math.random()}`,
      }}
    >
      <div className="grid xl:grid-cols-2 flex-1 w-full">
        {/* Text Editor Column */}
        <div className="w-full px-4 my-4 overflow-hidden overflow-y-auto rounded-lg h-screen flex-1">
          <ClientSideSuspense fallback={<div>Loading…</div>}>
            {() => <TextEditor />}
          </ClientSideSuspense>
        </div>

        {/* PDF Viewer Column */}
        <div className="w-full px-4 my-4 overflow-y-auto h-screen">
          {error && <div className="text-red-500 p-4">{error}</div>}

          {!pdfUrl ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="h-full flex items-center justify-center"
            >
              <div
                className={cn(
                  "rounded-lg border-2 border-dashed",
                  "p-12 text-center space-y-4",
                  "max-w-md mx-auto"
                )}
              >
                <motion.div
                  className="flex justify-center"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <FileText className="h-12 w-12 text-muted-foreground/60" />
                </motion.div>
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="font-semibold text-xl">No PDF Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a PDF file from the sidebar to view its contents
                    here.
                  </p>
                </motion.div>
                <motion.div
                  className="flex justify-center"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    duration: 1,
                  }}
                >
                  <div className="bg-muted/50 rounded-full p-2 mt-2">
                    <ArrowUpCircle className="h-6 w-6 text-muted-foreground/60 -rotate-90" />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Show search info if there's a search query */}
              {searchQuery && (
                <div className="mb-4 p-2 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm">
                    Showing results for: <strong>{searchQuery}</strong>
                  </span>
                  <button
                    onClick={() => {
                      router.push(
                        `/chats/${id}?pdfUrl=${encodeURIComponent(pdfUrl || "")}`
                      );
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-left w-full">
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
                              customTextRenderer={textRenderer}
                            />
                          ))}
                        </>
                      )}
                    </Document>
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </RoomProvider>
  );
};

export default PDFViewer;
