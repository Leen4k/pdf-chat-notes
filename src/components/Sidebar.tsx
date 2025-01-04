"use client";
import { Trash2 } from "lucide-react"; // Import trash icon
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { GrDocumentPdf } from "react-icons/gr";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useParams,
  useSearchParams,
  usePathname,
  useRouter,
} from "next/navigation";
import { useState } from "react";
import FileUpload from "./ui/FileUpload";
import { softDeleteFile } from "@/actions/deleteFile";
import { TbRestore } from "react-icons/tb";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { TbEdit } from "react-icons/tb";
import { IoIosArrowBack } from "react-icons/io";
import { GradientThemeSelector } from "./GradientThemeSelector";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { MoreVertical, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggler from "@/components/themes/ThemeToggler";
import { getCachedChats, setCachedChats } from "@/lib/cache/redis";
import { useAuth } from "@clerk/nextjs";

// Type definition remains the same
type DocumentChat = {
  id: string;
  pdfName: string;
  pdfUrl: string;
  createdAt: string;
  isSelected: boolean;
  chatId: string;
};

type TrashItem = {
  id: string;
  fileName: string;
  fileId: string;
};

type DialogConfig = {
  isOpen: boolean;
  type: "softDelete" | "restore" | "hardDelete" | null;
  fileId: string | null;
  title: string;
  description: string;
  actionLabel: string;
  actionButtonClass?: string;
};

interface RenameDialogState {
  isOpen: boolean;
  fileId: string | null;
  currentName: string;
}

// Fetch document chats
const fetchDocumentChats = async (chatId: string) => {
  const { data } = await axios.get(`/api/file?chatId=${chatId}`);
  return data.pdf;
};

// Toggle file selection function
const toggleFileSelection = async ({
  fileId,
  isSelected,
}: {
  fileId: string;
  isSelected: boolean;
}) => {
  const { data } = await axios.patch("/api/toggle", {
    fileId,
    isSelected,
  });
  return data;
};

// Delete file function
const deleteFile = async (fileId: string) => {
  const { data } = await axios.delete("/api/file", {
    data: { fileId },
  });
  return data;
};

const ChatSkeleton = () => (
  <SidebarMenuItem>
    <div className="flex items-center w-full space-x-4 p-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 flex-grow" />
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-8 w-8" />
    </div>
  </SidebarMenuItem>
);

const TrashSkeleton = () => (
  <SidebarMenuItem>
    <div className="flex items-center w-full space-x-4 p-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 flex-grow" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
  </SidebarMenuItem>
);

export function AppSidebar() {
  const { userId } = useAuth();
  const { chatId } = useParams();
  const queryClient = useQueryClient();
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    isOpen: false,
    type: null,
    fileId: null,
    title: "",
    description: "",
    actionLabel: "",
    actionButtonClass: "",
  });

  const [renameDialog, setRenameDialog] = useState<RenameDialogState>({
    isOpen: false,
    fileId: null,
    currentName: "",
  });

  const [isEditingChatName, setIsEditingChatName] = useState(false);
  const [editedChatName, setEditedChatName] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const { data: chatData, refetch: refetchChat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/${chatId}`);
      return response.data.data;
    },
    enabled: !!chatId,
    staleTime: 0, // Always fetch fresh data
  });

  // Soft delete mutation
  const softDeleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const { data } = await axios.post("/api/file/soft-delete", { fileId });
      return data;
    },
    onMutate: async (fileId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: ["documentChats", chatId],
        exact: false,
      });
      await queryClient.cancelQueries({
        queryKey: ["trashItems", chatId],
        exact: false,
      });

      // Snapshot the current data
      const previousDocumentChats = queryClient.getQueryData([
        "documentChats",
        chatId,
      ]);
      const previousTrashItems = queryClient.getQueryData([
        "trashItems",
        chatId,
      ]);

      // Optimistically update the document chats
      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[]) =>
          oldChats.filter((chat) => parseInt(chat.id) !== fileId)
      );

      // Optimistically update the trash items (if possible)
      // This depends on your backend response structure
      queryClient.setQueryData(
        ["trashItems", chatId],
        (oldTrashItems: any[]) => {
          // Assuming the backend returns the new trash item details
          return oldTrashItems;
        }
      );

      toast.loading("Moving file to trash", { id: "soft-delete" });

      return {
        previousDocumentChats,
        previousTrashItems,
      };
    },
    onSuccess: async (data) => {
      // Explicitly refetch both queries to ensure full synchronization
      await queryClient.refetchQueries({
        queryKey: ["documentChats", chatId],
        exact: false,
      });

      await queryClient.refetchQueries({
        queryKey: ["trashItems", chatId],
        exact: false,
      });

      toast.success(data.message, { id: "soft-delete" });
      closeDialog();
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["documentChats", chatId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["trashItems", chatId],
        exact: false,
      });
    },
    onError: (error, fileId, context) => {
      // Restore previous state if soft delete fails
      if (context) {
        queryClient.setQueryData(
          ["documentChats", chatId],
          context.previousDocumentChats
        );
        queryClient.setQueryData(
          ["trashItems", chatId],
          context.previousTrashItems
        );
      }

      toast.error("Failed to move file to trash", { id: "soft-delete" });
    },
    // Add retry logic to handle potential network issues
    // retry: 1,
  });

  const restoreFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const { data } = await axios.post("/api/file/trash/restore", { fileId });
      return data;
    },
    onMutate: () => {
      toast.loading("Restoring file", { id: "restore-file" });
    },
    onSuccess: (data) => {
      toast.success(data.message, { id: "restore-file" });
      closeDialog();

      // Invalidate both documentChats and trashItems queries to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ["documentChats", chatId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["trashItems", chatId],
        exact: false,
      });
    },
    onError: (error) => {
      toast.error("Failed to restore file", { id: "restore-file" });
    },
  });

  // Fetch document chats
  const { data: documentChats, isLoading: isChatsLoading } = useQuery({
    queryKey: ["documentChats", chatId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/file?chatId=${chatId}`);
      return data.pdf;
    },
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  //Fetch trash items
  const { data: trashItems, isLoading: isTrashLoading } = useQuery({
    queryKey: ["trashItems", chatId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/file/trash?chatId=${chatId}`);
      return data.data;
    },
    refetchInterval: 5000,
  });

  // Mutation for toggling file selection
  const toggleFileMutation = useMutation({
    mutationFn: toggleFileSelection,
    onMutate: async ({ fileId, isSelected }) => {
      await queryClient.cancelQueries({ queryKey: ["documentChats", chatId] });

      const previousChats = queryClient.getQueryData(["documentChats", chatId]);

      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[]) =>
          oldChats.map((chat) =>
            chat.id === fileId ? { ...chat, isSelected: isSelected } : chat
          )
      );

      return { previousChats };
    },
    onError: (err, { fileId, isSelected }, context) => {
      queryClient.setQueryData(
        ["documentChats", chatId],
        context?.previousChats
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documentChats", chatId] });
    },
  });

  const openDialog = (config: Omit<DialogConfig, "isOpen">) => {
    setDialogConfig({
      ...config,
      isOpen: true,
    });
  };

  const closeDialog = () => {
    setDialogConfig((prev) => ({
      ...prev,
      isOpen: false,
      fileId: null,
      type: null,
    }));
  };

  // Handle dialog action
  const handleDialogAction = () => {
    if (!dialogConfig.fileId) return;

    switch (dialogConfig.type) {
      case "softDelete":
        softDeleteMutation.mutate(parseInt(dialogConfig.fileId));
        break;
      case "restore":
        restoreFileMutation.mutate(dialogConfig.fileId);
        break;
      case "hardDelete":
        deleteFileMutation.mutate(dialogConfig.fileId);
        break;
    }
  };

  // Handle file selection toggle
  const handleToggleSelection = (fileId: string, currentStatus: boolean) => {
    toggleFileMutation.mutate({
      fileId,
      isSelected: !currentStatus,
    });
  };

  // Mutation for deleting a file
  const deleteFileMutation = useMutation({
    mutationFn: deleteFile,
    onMutate: async (fileId) => {
      // Optimistically remove the file from the list
      toast.loading("deleting file...", { id: "file-delete" });
      await queryClient.cancelQueries({ queryKey: ["documentChats", chatId] });

      const previousChats = queryClient.getQueryData(["documentChats", chatId]);

      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[]) =>
          oldChats.filter((chat) => chat.id !== fileId)
      );

      return { previousChats };
    },
    onError: (err, fileId, context) => {
      // Restore previous state if deletion fails
      queryClient.setQueryData(
        ["documentChats", chatId],
        context?.previousChats
      );
    },
    onSettled: (data) => {
      // Refresh the query after deletion
      toast.success(data.message, { id: "file-delete" });
      queryClient.invalidateQueries({
        queryKey: ["documentChats", chatId],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["trashItems", chatId],
        exact: false,
      });
      closeDialog();
    },
  });

  // Add rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({
      fileId,
      newName,
    }: {
      fileId: string;
      newName: string;
    }) => {
      const response = await axios.patch("/api/file/rename", {
        fileId,
        newName,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentChats"] });
      toast.success("File renamed successfully");
    },
    onError: () => {
      toast.error("Failed to rename file");
    },
  });

  // Add chat name update mutation
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
    onSuccess: () => {
      // Invalidate and refetch all related queries
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat updated successfully");
    },
    onError: () => {
      toast.error("Failed to update chat");
    },
  });

  // Add the delete mutation
  const deleteChatMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/chat/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Chat deleted successfully");
    },
    onError: (error) => {
      console.log("chat deletion error: ", error);
      toast.error("Failed to delete chat");
    },
    onSettled: () => {
      router.push("/");
    },
  });

  const searchParams = useSearchParams();
  const currentPdfUrl = searchParams.get("pdfUrl");

  const isActiveFile = (fileUrl: string) => {
    if (!currentPdfUrl) return false;
    try {
      return decodeURIComponent(currentPdfUrl) === decodeURIComponent(fileUrl);
    } catch {
      return currentPdfUrl === fileUrl;
    }
  };

  const onUploadComplete = (newFile: any) => {
    // Update the cache with the new file
    queryClient.setQueryData(
      ["documentChats", chatId],
      (oldData: any[] | undefined) => {
        if (!oldData) return [newFile];
        return [...oldData, newFile];
      }
    );

    // Also invalidate the query to ensure consistency
    queryClient.invalidateQueries({
      queryKey: ["documentChats", chatId],
    });

    toast.success("File uploaded successfully");
  };

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <IoIosArrowBack className="h-4 w-4" />
              <span>Go Back</span>
            </Link>
            <ThemeToggler />
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-1">
              <div className="flex items-center justify-between">
                {isEditingChatName ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (editedChatName.trim() && chatId) {
                        updateChatMutation.mutate({
                          id: parseInt(chatId as string),
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
                        chatId={chatId as string}
                        currentGradientId={chatData?.gradientId}
                      />
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
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
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* File Upload Component */}

                {/* Document chat items */}
                {isChatsLoading ? (
                  <>
                    <ChatSkeleton />
                    <ChatSkeleton />
                    <ChatSkeleton />
                  </>
                ) : documentChats?.length === 0 ? (
                  <>
                    <div className="flex items-center m-auto text-center py-4 h-[180px] text-muted-foreground">
                      No PDF files uploaded yet
                    </div>
                  </>
                ) : (
                  <>
                    {documentChats?.map((chat: DocumentChat) => (
                      <SidebarMenuItem
                        key={chat.id}
                        className="relative group px-2 py-1.5"
                      >
                        <SidebarMenuButton asChild>
                          <Link
                            className={`relative w-full flex items-center group gap-3 rounded-md p-2 ${
                              isActiveFile(chat.pdfUrl)
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/50"
                            }`}
                            href={`/chats/${
                              chat.chatId
                            }?pdfUrl=${encodeURIComponent(chat.pdfUrl)}`}
                          >
                            <GrDocumentPdf className="flex-shrink-0 h-4 w-4" />
                            <div className="flex-grow truncate flex items-center">
                              <span
                                className="truncate text-sm"
                                title={chat.pdfName}
                              >
                                {chat.pdfName}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setRenameDialog({
                                    isOpen: true,
                                    fileId: chat.id,
                                    currentName: chat.pdfName,
                                  });
                                }}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <TbEdit className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2 ml-2">
                              <Checkbox
                                checked={chat.isSelected}
                                onCheckedChange={() =>
                                  handleToggleSelection(
                                    chat.id,
                                    chat.isSelected
                                  )
                                }
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  openDialog({
                                    type: "softDelete",
                                    fileId: chat.id,
                                    title: "Move to Trash?",
                                    description:
                                      "This will move the file to trash",
                                    actionLabel: "Move to Trash",
                                    actionButtonClass:
                                      "bg-red-500 hover:bg-red-600",
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </>
                )}
              </SidebarMenu>
              <div className="mt-2">
                <FileUpload onUploadComplete={onUploadComplete} />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 py-1">
              <span className="text-sm font-bold">Trash</span>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {isTrashLoading ? (
                  <>
                    <TrashSkeleton />
                    <TrashSkeleton />
                  </>
                ) : trashItems?.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Trash is empty
                  </div>
                ) : (
                  trashItems?.map((item: TrashItem) => (
                    <SidebarMenuItem key={item.id} className="px-2 py-1.5">
                      <SidebarMenuButton asChild>
                        <div className="flex items-center gap-3">
                          <GrDocumentPdf className="flex-shrink-0 h-4 w-4" />
                          <span
                            className="flex-grow truncate text-sm"
                            title={item.fileName}
                          >
                            {item.fileName}
                          </span>
                          <div className="flex-shrink-0 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() =>
                                openDialog({
                                  type: "restore",
                                  fileId: item.fileId,
                                  title: "Restore File?",
                                  description:
                                    "This will restore the file from trash",
                                  actionLabel: "Restore",
                                  actionButtonClass:
                                    "bg-green-500 hover:bg-green-600",
                                })
                              }
                            >
                              <TbRestore className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={(e) => {
                                e.preventDefault();
                                openDialog({
                                  type: "hardDelete",
                                  fileId: item.fileId,
                                  title: "Delete Permanently?",
                                  description: "This action cannot be undone",
                                  actionLabel: "Delete Forever",
                                  actionButtonClass:
                                    "bg-red-500 hover:bg-red-600",
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Reusable Confirmation Dialog */}
      <AlertDialog open={dialogConfig.isOpen} onOpenChange={closeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDialogAction}
              className={dialogConfig.actionButtonClass}
            >
              {dialogConfig.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={renameDialog.isOpen}
        onOpenChange={(open) =>
          !open && setRenameDialog((prev) => ({ ...prev, isOpen: false }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename File</AlertDialogTitle>
            <AlertDialogDescription>
              <Input
                value={renameDialog.currentName}
                onChange={(e) =>
                  setRenameDialog((prev) => ({
                    ...prev,
                    currentName: e.target.value,
                  }))
                }
                placeholder="Enter new name"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (renameDialog.fileId && renameDialog.currentName.trim()) {
                  renameMutation.mutate({
                    fileId: renameDialog.fileId,
                    newName: renameDialog.currentName.trim(),
                  });
                  setRenameDialog({
                    isOpen: false,
                    fileId: null,
                    currentName: "",
                  });
                }
              }}
            >
              Rename
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Chat"
        description={`Are you sure you want to delete "${chatData?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          if (chatId) {
            deleteChatMutation.mutate(parseInt(chatId as string));
          }
        }}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  );
}
