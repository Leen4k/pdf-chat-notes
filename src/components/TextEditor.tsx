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
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Error from "next/error";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import debounce from "lodash/debounce";

interface TextEditorProps {
  editorContent: string;
  onChange: (content: string) => void;
}

const TextEditor = ({ editorContent, onChange }: TextEditorProps) => {
  const { chatId } = useParams();
  const queryClient = useQueryClient();

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
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: true,
  });

  const { mutate: saveContent } = useMutation({
    mutationFn: async (content: string) => {
      const response = await axios.post("/api/editor", {
        content,
        chatId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["editorContent", chatId],
      });
    }
  });

  const debouncedSave = debounce((content: string) => {
    saveContent(content);
  }, 1000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      ListItem,
      Heading.configure({
        HTMLAttributes: {
          class: "text-2xl font-bold my-4",
        },
        levels: [1, 2, 3],
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-4 my-2",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-4 my-2",
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
      handleClick: (view, pos, event) => {
        // Set cursor position on click
        const { state, dispatch } = view;
        const tr = state.tr;
        tr.setSelection(TextSelection.create(state.doc, pos));
        dispatch(tr);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      onChange(content);
      debouncedSave(content);
    },
    content: savedContent || preprocessContent(editorContent),
  });

  const { mutate: getAISuggestion } = useMutation({
    mutationFn: async (selectedText: string) => {
      try {
        const response = await axios.post("/api/question", {
          questionQuery: selectedText,
          chatId,
        });
        console.log(response.data);
        return response.data;
      } catch (err: any) {
        throw new Error(err);
      }
    },
    onMutate: () => {
      toast.loading("Getting AI suggestions...", { id: "ai-suggestion" });
    },
    onSuccess: (data) => {
      toast.success("AI suggestion fetched successfully", {
        id: "ai-suggestion",
      });

      // Insert AI response after selected text
      const selection = editor?.state.selection;
      const from = selection?.from;
      const to = selection?.to;

      if (editor && from !== undefined && to !== undefined) {
        const text = data.data;
        const parts = text.split(/(\*\*.*?\*\*)/g);

        const content = parts.map((part) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return {
              type: "text",
              marks: [{ type: "bold" }],
              text: part.slice(2, -2),
            };
          }
          return {
            type: "text",
            text: part,
          };
        });

        editor
          .chain()
          .focus()
          .insertContentAt(to, [
            {
              type: "paragraph",
              content,
            },
          ])
          .run();
      }
    },
    onError: () => {
      toast.error("Failed to get AI suggestions", { id: "ai-suggestion" });
    },
  });

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
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? "bg-gray-200 text-primary" : ""
      }`}
      title={title}
    >
      {children}
    </button>
  );

  return (
    <TooltipProvider>
      <div className="w-full border rounded-lg shadow-sm bg-white">
        <div className="flex items-center gap-1 p-2 border-b bg-gray-50 flex-wrap">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold (Ctrl+B)"
          >
            <b>B</b>
          </MenuButton>
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
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
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
        </div>
        <div className="relative">
          <EditorContent editor={editor} />
          <AnimatePresence>
            {editor.state.selection && !editor.state.selection.empty && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="absolute top-2 right-2"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleAISuggestion(
                          editor.state.doc.textBetween(
                            editor.state.selection.from,
                            editor.state.selection.to
                          )
                        )
                      }
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get AI suggestions</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default TextEditor;
