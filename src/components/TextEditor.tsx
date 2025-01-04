import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Heading from "@tiptap/extension-heading";
import Image from "next/image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { TextSelection } from "prosemirror-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, MessageCircle, Bold } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Error from "next/error";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import debounce from "lodash/debounce";
import html2pdf from "html2pdf.js";
import { pdfStyles } from "./PdfStyles";
import { TbFileDownload } from "react-icons/tb";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Node } from "@tiptap/core";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface TextEditorProps {
  editorContent: string;
  onChange: (content: string) => void;
}

// Add this type for dictionary response
type DictionaryResponse = {
  word: string;
  phonetic: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
};

const TextEditor = ({ editorContent, onChange }: TextEditorProps) => {
  const { chatId } = useParams();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

  const preprocessContent = (content: string) => {
    // Replace Markdown bold formatting with Tiptap bold markup
    return content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  const { data: savedContent } = useQuery({
    queryKey: ["editorContent", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/editor?chatId=${chatId}`);
      return response.data.data?.content || "";
    },
  });

  const { mutate: saveContent } = useMutation({
    mutationFn: async (content: string) => {
      await axios.post("/api/editor", {
        content,
        chatId,
      });
    },
    onError: () => {
      toast.error("Failed to save content");
    },
  });

  const debouncedSave = useMemo(
    () =>
      debounce((content: string) => {
        if (content && chatId) {
          saveContent(content);
        }
      }, 1000),
    [chatId, saveContent]
  );

  // Add state for word definition
  const [selectedWord, setSelectedWord] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const [initialPosition, setInitialPosition] = useState({ top: 0, left: 0 });
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

  // Add query for word definition
  const wordExplanationMutation = useMutation({
    mutationFn: async (word: string) => {
      const response = await axios.post("/api/explain", { word });
      return response.data;
    },
  });

  // Update the word selection handler with immediate position calculation
  const handleWordSelection = useCallback(
    (view: any, event: any) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const word = selection.toString().trim();
        if (word.length < 50) {
          setSelectedWord(word);
          wordExplanationMutation.mutate(word);

          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectedRange(range);

          // Calculate position immediately
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const popoverHeight = 200;
          const popoverWidth = 320;
          const margin = 10;

          // Position to the right of the selection by default
          let left = rect.right + margin;
          let top = rect.top + window.scrollY;

          // If popover would go off right edge, position to the left of selection
          if (left + popoverWidth > viewportWidth) {
            left = rect.left - popoverWidth - margin;
          }

          // If popover would go off bottom edge, adjust top position
          if (top + popoverHeight > viewportHeight + window.scrollY) {
            top = rect.bottom + window.scrollY - popoverHeight;
          }

          // Ensure minimum margins
          top = Math.max(margin + window.scrollY, top);
          left = Math.max(margin, left);

          setPopoverPosition({ top, left });
          setIsPopoverOpen(true);
        }
      }
      return false;
    },
    [wordExplanationMutation]
  );

  // Keep the updatePopoverPosition function for scroll/resize updates
  const updatePopoverPosition = useCallback(() => {
    if (selectedRange) {
      const rect = selectedRange.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const popoverHeight = 200; // Approximate height of popover
      const popoverWidth = 320; // Width of popover (w-80 = 320px)
      const margin = 10;

      // Position to the right of the selection by default
      let left = rect.right + margin;
      let top = rect.top + window.scrollY;

      // If popover would go off right edge, position to the left of selection
      if (left + popoverWidth > viewportWidth) {
        left = rect.left - popoverWidth - margin;
      }

      // If popover would go off bottom edge, adjust top position
      if (top + popoverHeight > viewportHeight + window.scrollY) {
        top = rect.bottom + window.scrollY - popoverHeight;
      }

      // Ensure minimum margins
      top = Math.max(margin + window.scrollY, top);
      left = Math.max(margin, left);

      setPopoverPosition({
        top,
        left,
      });
    }
  }, [selectedRange]);

  // Update editor props
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: {
          HTMLAttributes: {
            class: "",
          },
        },
      }),
      ListItem,
      Heading.configure({
        HTMLAttributes: {
          class: "text-2xl font-bold",
        },
        levels: [1, 2, 3],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-4",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-4",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      Underline,
      TextStyle,
      Color,
    ],
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-screen p-4 cursor-text",
      },
      handleDOMEvents: {
        mouseup: handleWordSelection,
        touchend: handleWordSelection,
      },
    },
    content: savedContent || "",
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onChange(content);
      debouncedSave(content);
    },
  });

  useEffect(() => {
    if (editor && savedContent && !editor.getText().trim()) {
      editor.commands.setContent(savedContent);
    }
  }, [editor, savedContent]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const { mutate: getAISuggestion } = useMutation({
    mutationFn: async (selectedText: string) => {
      try {
        const response = await axios.post("/api/question", {
          questionQuery: selectedText,
          chatId,
        });
        return {
          data: response.data.data,
          question: selectedText,
        };
      } catch (err: any) {
        throw new Error(err);
      }
    },
    onMutate: () => {
      // Add loading toast when mutation starts
      toast.loading("Getting AI suggestions...", { id: "ai-suggestion" });
    },
    onSuccess: (data) => {
      if (editor) {
        const { data: htmlContent, question } = data;

        const formattedContent = `
<div class="ai-qa-block">
  <div class="ai-question"><strong>Q:</strong> ${question}</div>
  <div class="ai-response">${htmlContent
    .replace("```html", "")
    .replace("```", "")}</div>
</div>`;

        editor.chain().focus().insertContent(formattedContent.trim()).run();

        // Update the loading toast to success
        toast.success("AI suggestion added", { id: "ai-suggestion" });
      }
    },
    onError: () => {
      // Update the loading toast to error
      toast.error("Failed to get AI suggestions", { id: "ai-suggestion" });
    },
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState(
    `document-${new Date().toISOString().split("T")[0]}.pdf`
  );

  const exportToPDF = (customFilename?: string) => {
    if (!editor) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = `
      <style>${pdfStyles}</style>
      <div class="prose max-w-none mx-4">
        ${editor.getHTML()}
      </div>
    `;

    const defaultFilename = `document-${
      new Date().toISOString().split("T")[0]
    }.pdf`;

    const opt = {
      margin: [0.5, 0.5],
      filename: customFilename || defaultFilename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    };

    toast.loading("Generating PDF...", { id: "pdf-export" });

    html2pdf()
      .set(opt)
      .from(tempDiv)
      .save()
      .then(() => {
        toast.success("PDF exported successfully", { id: "pdf-export" });
      })
      .catch((error: any) => {
        console.error("PDF export error:", error);
        toast.error("Failed to export PDF", { id: "pdf-export" });
      });
  };

  // Update the editor styles for more compact formatting
  const editorStyles = `
   
  `;

  // Add the styles to the document
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = editorStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  // Single selection coordinates function
  const getSelectionCoords = useCallback(() => {
    if (!editor || !editorContainerRef.current)
      return { top: 0, left: 0, width: 0 };

    const selection = window.getSelection();
    if (!selection?.rangeCount) return { top: 0, left: 0, width: 0 };

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    const editorRect = editorContainerRef.current.getBoundingClientRect();

    // Get the last rect for end of selection
    const lastRect = rects[rects.length - 1];

    return {
      top: lastRect.bottom - editorRect.top + window.scrollY,
      left: lastRect.right - editorRect.left,
      width: lastRect.width,
    };
  }, [editor]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Add this state for AI button position
  const [aiButtonPosition, setAiButtonPosition] = useState({
    top: -60,
    left: 0,
  });

  // Update the updateAIButtonPosition function
  const updateAIButtonPosition = useCallback(() => {
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const selectedText = editor.state.doc
      .textBetween(editor.state.selection.from, editor.state.selection.to)
      .trim();

    // Only update position if there's actual text selected
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const buttonWidth = 80; // Approximate width of AI button
      const buttonHeight = 24; // Approximate height of AI button
      const margin = 8;

      // Position above the selection
      const left = Math.max(margin, rect.left);
      const top = Math.max(
        margin,
        rect.top + window.scrollY - buttonHeight - margin
      );

      setAiButtonPosition({
        top,
        left,
      });
    }
  }, [editor]);

  // Add effect to update position on selection change
  useEffect(() => {
    if (!editor) return;

    const updateOnSelect = () => {
      if (editor.state.selection.content()) {
        updateAIButtonPosition();
      }
    };

    editor.on("selectionUpdate", updateOnSelect);
    return () => {
      editor.off("selectionUpdate", updateOnSelect);
    };
  }, [editor, updateAIButtonPosition]);

  // Add new state for comment dialog
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedContent, setSelectedContent] = useState("");

  // Update the comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({
      content,
      comment,
    }: {
      content: string;
      comment: string;
    }) => {
      const response = await axios.post("/api/comment", { content, comment });
      return response.data;
    },
    onSuccess: (data) => {
      if (editor) {
        // Store the current selection
        const from = editor.state.selection.from;
        const to = editor.state.selection.to;

        // Format the response similar to Ask AI
        const formattedContent = `
<div class="ai-qa-block">
  <div class="ai-question"><strong>💭 Comment:</strong> ${commentText}</div>
  <div class="ai-response">${data.data}</div>
</div>`;

        // Insert the response after the selected text
        editor.chain().focus().insertContentAt(to, formattedContent).run();

        // Restore the original selection
        editor.commands.setTextSelection({ from, to });
      }
      setIsCommentDialogOpen(false);
      setCommentText("");
      toast.success("Comment processed successfully");
    },
    onError: () => {
      toast.error("Failed to process comment");
    },
  });

  // Add this state to track if text is selected
  const [isTextSelected, setIsTextSelected] = useState(false);

  // Update the effect that handles selection changes
  useEffect(() => {
    if (!editor) return;

    const updateSelection = () => {
      const hasSelection = !editor.state.selection.empty;
      setIsTextSelected(hasSelection);
      if (hasSelection) {
        updateAIButtonPosition();
      }
    };

    // Listen for both selection update and focus/blur events
    editor.on("selectionUpdate", updateSelection);
    editor.on("blur", () => setIsTextSelected(false));
    editor.on("focus", updateSelection);

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("blur", () => setIsTextSelected(false));
      editor.off("focus", updateSelection);
    };
  }, [editor, updateAIButtonPosition]);

  if (!editor) {
    return null;
  }

  const handleAISuggestion = (selectedText: string) => {
    selectedText && getAISuggestion(selectedText);
  };

  const MenuButton = ({
    onClick,
    isActive,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 hover:text-black transition-colors ${
        isActive ? "bg-gray-200 text-primary" : ""
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <TooltipProvider>
      <div className="w-full border rounded-lg shadow-sm bg-card">
        <div className="sticky -top-4 z-50 border-b bg-background/95 dark:bg-card backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-1 p-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              data-active={editor?.isActive("bold")}
              className={editor?.isActive("bold") ? "bg-accent" : ""}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <MenuButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              title="Italic (Ctrl+I)"
            >
              <i>I</i>
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              title="Strikethrough"
            >
              <span className="line-through">S</span>
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              title="Underline"
            >
              <span className="underline">U</span>
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive("highlight")}
              title="Highlight"
            >
              <span className="bg-yellow-200">H</span>
            </MenuButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              title="Heading 1"
            >
              <span className="font-bold">H1</span>
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              title="Heading 2"
            >
              <span className="font-bold">H2</span>
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              title="Heading 3"
            >
              <span className="font-bold">H3</span>
            </MenuButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <MenuButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              title="Bullet List"
            >
              <Image
                src="/bullet-list.svg"
                alt="Bullet list"
                width={16}
                height={16}
                className="w-5 h-5"
              />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Ordered List"
            >
              <Image
                src="/numbered-list.svg"
                alt="Numbered list"
                width={16}
                height={16}
                className="w-5 h-5"
              />
            </MenuButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              title="Align Left"
            >
              ←
            </MenuButton>
            <MenuButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              title="Align Center"
            >
              ↔
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              title="Align Right"
            >
              →
            </MenuButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <input
              type="color"
              onChange={(e) =>
                editor.chain().focus().setColor(e.target.value).run()
              }
              className="w-8 h-8 p-1 rounded cursor-pointer"
              title="Text Color"
            />
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <MenuButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
            >
              ↶
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
            >
              ↷
            </MenuButton>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <MenuButton
              onClick={() => setIsExportDialogOpen(true)}
              title="Export as PDF"
            >
              <TbFileDownload className="w-5 h-5" />
            </MenuButton>
          </div>
        </div>
        <div className="bg-card">
          <EditorContent editor={editor} />
        </div>
        <AnimatePresence>
          {isTextSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 flex items-center gap-1 rounded-md shadow-lg border bg-background"
              style={{
                top: aiButtonPosition.top,
                left: aiButtonPosition.left,
              }}
            >
              <div className="flex gap-1">
                <Button
                  variant="default"
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() =>
                    handleAISuggestion(
                      editor.state.doc.textBetween(
                        editor.state.selection.from,
                        editor.state.selection.to
                      )
                    )
                  }
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Ask AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap"
                  onClick={() => {
                    setSelectedContent(
                      editor.state.doc.textBetween(
                        editor.state.selection.from,
                        editor.state.selection.to
                      )
                    );
                    setIsCommentDialogOpen(true);
                  }}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Comment
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AlertDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export as PDF</AlertDialogTitle>
            <AlertDialogDescription>
              <Input
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="Enter file name"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const filename = exportFilename.endsWith(".pdf")
                  ? exportFilename
                  : `${exportFilename}.pdf`;
                exportToPDF(filename);
              }}
            >
              Export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverContent
          className="w-80"
          style={{
            position: "fixed",
            ...popoverPosition,
            zIndex: 50,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {wordExplanationMutation.isPending ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : wordExplanationMutation.data?.data ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: wordExplanationMutation.data.data
                  .replace("```html", "")
                  .replace("```", ""),
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground p-2">
              Select a word to see its explanation
            </p>
          )}
        </PopoverContent>
      </Popover>
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">Selected text:</p>
              <p className="text-sm mt-1">{selectedContent}</p>
            </div>
            <Textarea
              placeholder="Enter your comment or question..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCommentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (commentText.trim()) {
                  commentMutation.mutate({
                    content: selectedContent,
                    comment: commentText,
                  });
                }
              }}
              disabled={!commentText.trim() || commentMutation.isPending}
            >
              {commentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default TextEditor;
