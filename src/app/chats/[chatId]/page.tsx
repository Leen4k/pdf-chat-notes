"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams, useSearchParams } from "next/navigation";
import TextEditor from "@/components/TextEditor";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import { Skeleton } from "@/components/ui/skeleton";

// Ensure PDF.js worker is loaded
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

const PDFViewer = () => {
  const { id } = useParams();
  const pdfUrl = useSearchParams().get("pdfUrl");
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string>("");

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const handleLoadError = (error: Error) => {
    console.error("PDF Load Error:", error);
    setError("Failed to load PDF. Check console for details.");
  };

  return (
    <div className="grid grid-cols-2">
      {/* Text Editor Column */}
      <div className="w-full p-4 overflow-y-auto rounded-lg h-screen flex-1">
        <TextEditor editorContent={text} onChange={setText} />
      </div>

      {/* PDF Viewer Column */}
      <div className="w-full p-4 overflow-y-auto h-screen">
        {error && <div className="text-red-500 p-4">{error}</div>}

        <Document
          file={(pdfUrl as string) || ""}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="space-y-4">
              <Skeleton className="h-[842px] w-[595px] mx-auto" />{" "}
              {/* A4 dimensions in pixels */}
              <Skeleton className="h-[842px] w-[595px] mx-auto" />
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
                  width={595} // A4 width in pixels
                />
              ))}
            </>
          )}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
