"use client";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useParams, useSearchParams } from "next/navigation";
import TextEditor from "@/components/TextEditor";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

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
    <div className="flex">
      {/* Text Editor Column */}
      <div className="w-1/2 p-4 overflow-y-auto h-screen">
        <TextEditor editorContent={text} onChange={setText} />
      </div>

      {/* PDF Viewer Column */}
      <div className="w-1/2 p-4 overflow-y-auto h-screen">
        {error && <div className="text-red-500 p-4">{error}</div>}

        <Document
          file={(pdfUrl as string) || ""}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={<div>Loading PDF...</div>}
          className="space-y-4" // Add vertical spacing between pages
        >
          {numPages && (
            <>
              {[...Array(numPages)].map((_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  renderTextLayer={true} // Enable text selection
                  renderAnnotationLayer={true} // Enable annotations
                  className="shadow-md mb-4 w-full" // Add shadow and margin between pages
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
