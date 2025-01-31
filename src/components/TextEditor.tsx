import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import Heading from "@tiptap/extension-heading";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, MessageCircle, Bold, Undo2, Book } from "lucide-react";
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
import {
  useLiveblocksExtension,
  FloatingComposer,
  FloatingThreads,
  AnchoredThreads,
} from "@liveblocks/react-tiptap";
import { ClientSideSuspense, useThreads } from "@liveblocks/react";
import {
  useRoom,
  useOthers,
  useSelf,
  useStorage,
  useMutation as useLiveblocksMutation,
} from "@/liveblocks.config";
import { GoListUnordered, GoListOrdered } from "react-icons/go";
import { RoomProvider } from "@liveblocks/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const TextEditorContent = () => {
  const { chatId } = useParams();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const room = useRoom();
  const others = useOthers();
  const currentUser = useSelf();
  const editorRef = useRef<any>(null);

  const preprocessContent = (content: string) => {
    // Replace Markdown bold formatting with Tiptap bold markup
    return content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };

  // Update the liveblocks extension configuration
  const liveblocks = useLiveblocksExtension({
    field: chatId as string,
    offlineSupport_experimental: true,
    collaborative: true,
    sync: {
      defaultSelection: true,
      defaultCursor: true,
    },
  });

  // Modify the content storage hook to be more specific
  const content = useStorage((root) => root.content);

  // Add loading state for storage
  const isStorageLoading = useStorage((root) => root.content === undefined);

  // Modify the save mutation to handle both local save and storage update
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

  // Update the debounced save to handle both local and remote saves
  const debouncedSave = useMemo(
    () =>
      debounce((content: string) => {
        if (content && chatId) {
          saveContent(content);
        }
      }, 1000),
    [chatId, saveContent]
  );

  // Add query for word definition
  const wordExplanationMutation = useMutation({
    mutationFn: async (word: string) => {
      const response = await axios.post("/api/explain", { word });
      return response.data;
    },
  });

  // Create the mutation outside of any conditions
  const updateContent = useLiveblocksMutation(
    ({ storage }, newContent: string) => {
      try {
        if (storage && newContent !== storage.get("content")) {
          storage.set("content", newContent);
        }
      } catch (error) {
        console.error("Failed to update content:", error);
        toast.error("Failed to sync content");
      }
    },
    []
  );

  // Modify the editor configuration
  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        heading: false,
        paragraph: {
          HTMLAttributes: {
            class: "text-inherit",
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
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-screen p-4 cursor-text text-foreground dark:text-foreground",
      },
    },
    content: "", // Start empty and let the effect handle content
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      // Only update if content has actually changed and we're ready
      if (isInitialContentSet && newContent !== content) {
        updateContent(newContent);
        debouncedSave(newContent);
      }
    },
  });

  // Add recovery mechanism for content
  useEffect(() => {
    if (editor && content === undefined) {
      // Try to recover content from local storage
      const savedContent = localStorage.getItem(`editor-content-${chatId}`);
      if (savedContent) {
        updateContent(savedContent);
      }
    }
  }, [editor, content, chatId, updateContent]);

  // Save content to local storage as backup
  useEffect(() => {
    if (content) {
      localStorage.setItem(`editor-content-${chatId}`, content);
    }
  }, [content, chatId]);

  // Check if content is undefined (loading state)
  if (content === undefined) {
    return <div>Loading...</div>;
  }

  // Add a loading state for initial content
  const [isInitialContentSet, setIsInitialContentSet] = useState(false);

  // Update the cursor update handler
  const updateCursor = useCallback(() => {
    if (!editorRef.current || !room) return;

    const selection = editorRef.current.view.state.selection;
    const { from } = selection;

    const editorElement = editorRef.current.view.dom;
    const editorRect = editorElement.getBoundingClientRect();
    const pos = editorRef.current.view.coordsAtPos(from);

    // Calculate position relative to viewport
    const x = pos.left - editorRect.left + window.scrollX;
    const y = pos.top - editorRect.top + window.scrollY;

    room.updatePresence({
      cursor: {
        x,
        y,
      },
      selection: {
        from,
        to: selection.to,
      },
    });
  }, [room]);

  // Add loading states
  const [isLoading, setIsLoading] = useState(true);

  // Improve the content initialization effect
  useEffect(() => {
    if (editor && content !== undefined && !isInitialContentSet) {
      // Only set content if it's not empty
      if (content && content.trim() !== "") {
        editor.commands.setContent(content);
      }
      setIsInitialContentSet(true);
      setIsLoading(false);
    }
  }, [editor, content, isInitialContentSet]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      setIsInitialContentSet(false);
    };
  }, []);

  // Update editorRef when editor instance changes
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  // Update the cursor effect to use editorRef
  useEffect(() => {
    if (!editorRef.current || !room) return;

    const handleSelectionUpdate = () => {
      updateCursor();
    };

    const handleScroll = () => {
      updateCursor();
    };

    editorRef.current.on("selectionUpdate", handleSelectionUpdate);
    window.addEventListener("scroll", handleScroll);

    return () => {
      if (editorRef.current) {
        editorRef.current.off("selectionUpdate", handleSelectionUpdate);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [room, updateCursor]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  const { mutate: getAISuggestion, isPending: getAISuggestionPending } =
    useMutation({
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
<div class="">
  <div class="mb-3"><strong>Q:</strong> ${question}</div>
  <div class="mt-3">${htmlContent.replace("```html", "").replace("```", "")}</div>
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
    .ProseMirror {
      color: inherit;
    }

    .ProseMirror p {
      color: inherit;
    }

    .ProseMirror li {
      color: inherit;
    }

    /* Override default selection color */
    .ProseMirror ::selection {
      background: var(--selection-color, #b4d5fe);
      color: inherit;
    }

    /* Add spacing between paragraphs and lists */
    .ProseMirror p {
      margin-bottom: 1em;
    }

    .ProseMirror ul,
    .ProseMirror ol {
      margin: 1em 0;
    }

    .ProseMirror li {
      margin: 0.5em 0;
    }

    /* Ensure proper text contrast in dark mode */
    .dark .ProseMirror {
      color: var(--foreground);
    }
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

  // Add this state to track if the buttons should be visible
  const [showButtons, setShowButtons] = useState(false);

  // Update the effect that handles selection changes
  useEffect(() => {
    if (!editor) return;

    let timeoutId: NodeJS.Timeout;

    const updateSelection = () => {
      const hasSelection = !editor.state.selection.empty;

      // Clear any existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Add a small delay before updating the state
      timeoutId = setTimeout(() => {
        setShowButtons(hasSelection);
        if (hasSelection) {
          updateAIButtonPosition();
        }
      }, 100);
    };

    editor.on("selectionUpdate", updateSelection);
    editor.on("blur", () => {
      // Don't immediately hide on blur
      timeoutId = setTimeout(() => setShowButtons(false), 200);
    });
    editor.on("focus", updateSelection);

    return () => {
      editor.off("selectionUpdate", updateSelection);
      editor.off("blur", () => setShowButtons(false));
      editor.off("focus", updateSelection);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [editor, updateAIButtonPosition]);

  // Add new state for comment dialog
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedContent, setSelectedContent] = useState("");

  // Add this state near the other state declarations
  const [commentPosition, setCommentPosition] = useState({ top: 0, left: 0 });

  // Update the comment button click handler to calculate position
  const handleCommentClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Calculate position for comment popover
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const popoverHeight = 300; // Approximate height of popover
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

      setCommentPosition({ top, left });
    }

    setSelectedContent(
      editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      )
    );
    setIsCommentDialogOpen(true);
  };

  // Update the comment mutation to handle loading state better
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
<div class="mt-3">
  <div class="mb-3"><strong>💭 Comment:</strong> ${commentText}</div>
  <div class="mt-3">${data.data}</div>
</div>`;

        // Insert the response after the selected text
        editor.chain().focus().insertContentAt(to, formattedContent).run();

        // Restore the original selection
        editor.commands.setTextSelection({ from, to });
      }
      // Only close and reset after success
      setIsCommentDialogOpen(false);
      setCommentText("");
      toast.success("Comment processed successfully");
    },
    onError: () => {
      toast.error("Failed to process comment");
    },
  });

  const ThreadOverlay = () => {
    const { threads } = useThreads({ query: { resolved: false } });

    return (
      <>
        <FloatingThreads
          editor={editor}
          threads={threads}
          className="w-[350px] block md:hidden"
        />
        <AnchoredThreads
          editor={editor}
          threads={threads}
          className="w-[350px] hidden md:block"
        />
      </>
    );
  };
  // Add new state for dictionary dialog
  const [isDictionaryDialogOpen, setIsDictionaryDialogOpen] = useState(false);
  const [wordToLookup, setWordToLookup] = useState("");

  // Update the floating buttons section in the render
  {
    showButtons && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: -20 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.1 }}
        className="fixed z-50 flex items-center gap-1 rounded-md shadow-lg"
        style={{
          top: aiButtonPosition.top,
          left: aiButtonPosition.left,
        }}
      >
        <div className="flex gap-1">
          <Button
            variant="default"
            size="sm"
            className="h-6 text-xs whitespace-nowrap p-4"
            onMouseDown={(e) => {
              // Prevent the button click from removing the selection
              e.preventDefault();
            }}
            onClick={() => {
              setShowButtons(false);
              const selectedText = editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to
              );
              handleAISuggestion(selectedText);
            }}
          >
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Ask AI
            </div>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs whitespace-nowrap p-4"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={handleCommentClick}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            Comment
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-xs whitespace-nowrap p-4"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              const selectedText = editor.state.doc.textBetween(
                editor.state.selection.from,
                editor.state.selection.to
              );
              setWordToLookup(selectedText);
              setIsDictionaryDialogOpen(true);
              wordExplanationMutation.mutate(selectedText);
            }}
          >
            <Book className="h-3 w-3 mr-1" />
            Dictionary
          </Button>
        </div>
      </motion.div>
    );
  }

  // Show loading state while storage is initializing or content is loading
  if (isStorageLoading || isLoading) {
    return (
      <div className="w-full border rounded-lg shadow-sm bg-card min-h-screen">
        <div className="border-b bg-background/95 dark:bg-card">
          <div className="flex items-center gap-1 p-2 flex-wrap">
            {/* Skeleton loading for toolbar buttons */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-8 w-8 rounded bg-muted animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }

  const handleAISuggestion = (selectedText: string) => {
    setShowButtons(false);
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

  const ActiveUsers = () => {
    const others = useOthers();
    const currentUser = useSelf();

    return (
      <div className="fixed top-2 right-4 flex items-center gap-1 bg-background/95 p-2 rounded-full border shadow-sm">
        {/* Show current user first */}
        {currentUser && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-primary">
                <AvatarImage src={currentUser.info?.avatar} />
                <AvatarFallback>
                  {currentUser.info?.name?.slice(0, 2).toUpperCase() || "ME"}
                </AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="w-60">
              <div className="flex justify-between space-x-4">
                <Avatar>
                  <AvatarImage src={currentUser.info?.avatar} />
                  <AvatarFallback>
                    {currentUser.info?.name?.slice(0, 2).toUpperCase() || "ME"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    {currentUser.info?.name || "Me"} (You)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Currently Active
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}

        {/* Show other active users */}
        {others.map(({ connectionId, info }) => (
          <HoverCard key={connectionId}>
            <HoverCardTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-green-500">
                <AvatarImage src={info?.avatar} />
                <AvatarFallback>
                  {info?.name?.slice(0, 2).toUpperCase() || "AN"}
                </AvatarFallback>
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent className="w-60">
              <div className="flex justify-between space-x-4">
                <Avatar>
                  <AvatarImage src={info?.avatar} />
                  <AvatarFallback>
                    {info?.name?.slice(0, 2).toUpperCase() || "AN"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">
                    {info?.name || "Anonymous"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Currently Active
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="w-full border rounded-lg shadow-sm">
        <div className="sticky rounded-t-lg -top-4 z-50 border-b bg-background/95 dark:bg-card backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <GoListUnordered />
            </MenuButton>
            <MenuButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              title="Ordered List"
            >
              <GoListOrdered />
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
            <div className="w-px h-6 bg-gray-300 mx-1" />
            {/* <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (editor) {
                      editor.commands.setContent(SAMPLE_CONTENT);
                      // If you're using Liveblocks, also update the storage
                      updateContent(SAMPLE_CONTENT);
                      toast.success("Content restored");
                    }
                  }}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restore Sample Content</p>
              </TooltipContent>
            </Tooltip> */}
          </div>
        </div>
        <div className="bg-card relative">
          <EditorContent editor={editor} />
          <FloatingComposer editor={editor} style={{ width: 350 }} />
          <ClientSideSuspense fallback={null}>
            <ThreadOverlay />
          </ClientSideSuspense>
        </div>
        <AnimatePresence>
          {showButtons && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -20 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 flex items-center gap-1 rounded-md shadow-lg"
              style={{
                top: aiButtonPosition.top,
                left: aiButtonPosition.left,
              }}
            >
              <div className="flex gap-1">
                <Button
                  variant="default"
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap p-4"
                  onMouseDown={(e) => {
                    // Prevent the button click from removing the selection
                    e.preventDefault();
                  }}
                  onClick={() => {
                    const selectedText = editor.state.doc.textBetween(
                      editor.state.selection.from,
                      editor.state.selection.to
                    );
                    handleAISuggestion(selectedText);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Ask AI
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap p-4"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={handleCommentClick}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Comment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs whitespace-nowrap p-4"
                  onMouseDown={(e) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    const selectedText = editor.state.doc.textBetween(
                      editor.state.selection.from,
                      editor.state.selection.to
                    );
                    setWordToLookup(selectedText);
                    setIsDictionaryDialogOpen(true);
                    wordExplanationMutation.mutate(selectedText);
                  }}
                >
                  <Book className="h-3 w-3 mr-1" />
                  Dictionary
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
      <Dialog
        open={isDictionaryDialogOpen}
        onOpenChange={setIsDictionaryDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="space-y-8">
            <DialogTitle>Dictionary</DialogTitle>
            <div className="flex gap-2 mt-4">
              <Input
                value={wordToLookup}
                onChange={(e) => setWordToLookup(e.target.value)}
                placeholder="Enter word to look up"
              />
              <Button
                onClick={() => wordExplanationMutation.mutate(wordToLookup)}
                disabled={
                  !wordToLookup.trim() || wordExplanationMutation.isPending
                }
              >
                {wordExplanationMutation.isPending ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Looking up...</span>
                  </div>
                ) : (
                  "Look up"
                )}
              </Button>
            </div>
          </DialogHeader>
          <div className="mt-4 max-h-[400px] overflow-y-auto rounded-md border border-input bg-background p-4 shadow-sm">
            {wordExplanationMutation.isPending ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : wordExplanationMutation.data?.data ? (
              <div className="prose prose-sm max-w-none space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-base">Definition:</h3>
                  <div
                    className="text-sm text-muted-foreground pl-4"
                    dangerouslySetInnerHTML={{
                      __html: wordExplanationMutation.data.data
                        .split("Part of Speech:")[0]
                        .replace("Definition:", "")
                        .replace("```html", "")
                        .replace("```", "")
                        .trim(),
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-base">Part of Speech:</h3>
                  <div
                    className="text-sm text-muted-foreground pl-4"
                    dangerouslySetInnerHTML={{
                      __html:
                        wordExplanationMutation.data.data
                          .split("Example of Usage:")[0]
                          .split("Part of Speech:")[1]
                          ?.trim() || "Part of speech not available",
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium text-base">Example:</h3>
                  <div
                    className="text-sm text-muted-foreground pl-4"
                    dangerouslySetInnerHTML={{
                      __html:
                        wordExplanationMutation.data.data
                          .split("Example of Usage:")[1]
                          ?.replace("```", "")
                          ?.trim() || "Example not available",
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a word and click "Look up" to see its explanation
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDictionaryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Popover open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <PopoverContent
          className="w-80"
          style={{
            position: "fixed",
            top: commentPosition.top,
            left: commentPosition.left,
            zIndex: 50,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-muted-foreground">Selected text:</p>
              <div className="max-h-32 overflow-y-auto relative">
                <p className="text-sm mt-1 pr-2">{selectedContent}</p>
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-muted/50 to-transparent pointer-events-none" />
              </div>
            </div>
            <Textarea
              placeholder="@example please elaborate more..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCommentDialogOpen(false)}
                disabled={commentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
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
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <ActiveUsers />
    </TooltipProvider>
  );
};

export default function TextEditor() {
  return (
    <ClientSideSuspense fallback={<div>Loading...</div>}>
      {() => <TextEditorContent />}
    </ClientSideSuspense>
  );
}
