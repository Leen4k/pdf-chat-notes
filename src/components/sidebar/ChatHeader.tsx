import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { IoIosArrowBack } from "react-icons/io";
import { MoreVertical, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ThemeToggler from "@/components/themes/ThemeToggler";
import { GradientThemeSelector } from "@/components/GradientThemeSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";

interface ChatHeaderProps {
  chatData?: {
    id: number;
    name: string;
    gradientId?: number;
  };
}

export const ChatHeader = ({ chatData }: ChatHeaderProps) => {
  const [isEditingChatName, setIsEditingChatName] = useState(false);
  const [editedChatName, setEditedChatName] = useState(chatData?.name || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { chatId } = useParams();

  const updateChatMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      gradientId,
    }: {
      id: number;
      name: string;
      gradientId?: number;
    }) => {
      const response = await axios.patch(`/api/chat/${id}`, {
        name,
        gradientId,
      });
      return response.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });

      setIsEditingChatName(false);
      toast.success("Chat updated successfully");
    },
    onError: () => {
      toast.error("Failed to update chat");
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/chat/${id}`);
      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["chats"] }),
        queryClient.invalidateQueries({ queryKey: ["chat", chatData?.id] }),
      ]);
      toast.success("Chat deleted successfully");
      router.push("/");
    },
    onError: (error) => {
      console.error("Chat deletion error:", error);
      toast.error("Failed to delete chat");
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium">
          <IoIosArrowBack className="h-4 w-4" />
          <span>Go Back</span>
        </Link>
        <ThemeToggler />
      </div>

      <div className="pl-4 py-1">
        <div className="flex items-center justify-between">
          {isEditingChatName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editedChatName.trim() && chatData?.id) {
                  updateChatMutation.mutate({
                    id: chatData.id,
                    name: editedChatName,
                  });
                }
              }}
              className="flex-1"
            >
              <Input
                value={editedChatName}
                onChange={(e) => setEditedChatName(e.target.value)}
                onBlur={() => setIsEditingChatName(false)}
                autoFocus
                className="h-8 text-sm"
              />
            </form>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span
                className="cursor-pointer hover:text-primary flex items-center gap-2 text-sm font-bold"
                onClick={() => {
                  setEditedChatName(chatData?.name || "");
                  setIsEditingChatName(true);
                }}
              >
                {chatData?.name || "My Chats"}
              </span>
              <div className="flex items-center gap-1">
                <GradientThemeSelector
                  chatId={chatData?.id.toString() || ""}
                  currentGradientId={chatData?.gradientId}
                />
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Chat"
        description={`Are you sure you want to delete "${chatData?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (chatData?.id) {
            deleteChatMutation.mutate(chatData.id);
          }
        }}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  );
};
