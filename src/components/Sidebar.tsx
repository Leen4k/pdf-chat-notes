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
import { useParams } from "next/navigation";
import { useState } from "react";
import FileUpload from "./ui/FileUpload";
import { softDeleteFile } from "@/actions/deleteFile";
import { TbRestore } from "react-icons/tb";
import toast from "react-hot-toast";
import { Skeleton } from "@/components/ui/skeleton";

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
  type: 'softDelete' | 'restore' | 'hardDelete' | null;
  fileId: string | null;
  title: string;
  description: string;
  actionLabel: string;
  actionButtonClass?: string;
};

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
  const { chatId } = useParams();
  const queryClient = useQueryClient();
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    isOpen: false,
    type: null,
    fileId: null,
    title: '',
    description: '',
    actionLabel: '',
    actionButtonClass: ''
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
    queryFn: () => fetchDocumentChats(chatId as string),
  });

  //Fetch trash items
  const { data: trashItems, isLoading: isTrashLoading } = useQuery({
    queryKey: ["trashItems", chatId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/file/trash?chatId=${chatId}`);
      return data.data;
    },
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

  const openDialog = (config: Omit<DialogConfig, 'isOpen'>) => {
    setDialogConfig({
      ...config,
      isOpen: true
    });
  };

  const closeDialog = () => {
    setDialogConfig(prev => ({
      ...prev,
      isOpen: false,
      fileId: null,
      type: null
    }));
  };

  // Handle dialog action
  const handleDialogAction = () => {
    if (!dialogConfig.fileId) return;

    switch (dialogConfig.type) {
      case 'softDelete':
        softDeleteMutation.mutate(parseInt(dialogConfig.fileId));
        break;
      case 'restore':
        restoreFileMutation.mutate(dialogConfig.fileId);
        break;
      case 'hardDelete':
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

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Link href={"/"}>My Chats</Link>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {/* File Upload Component */}
                <FileUpload />

                {/* Document chat items */}
                {isChatsLoading ? (
                  <>
                    <ChatSkeleton />
                    <ChatSkeleton />
                    <ChatSkeleton />
                  </>
                ) : (
                  <>
                    {documentChats?.map((chat: DocumentChat) => (
                      <SidebarMenuItem key={chat.id} className="relative group">
                        <SidebarMenuButton asChild>
                          <Link
                            className="relative w-full flex items-center"
                            href={`/chats/${chat.chatId}?pdfUrl=${chat.pdfUrl}`}
                          >
                            <GrDocumentPdf />
                            <span className="ml-2 flex-grow flex-1">
                              {chat.pdfName.slice(0, 10)}...
                            </span>
                            <Checkbox
                              checked={chat.isSelected}
                              onCheckedChange={() =>
                                handleToggleSelection(chat.id, chat.isSelected)
                              }
                              className="ml-2"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2"
                              onClick={(e) => {
                                e.preventDefault();
                                openDialog({
                                  type: 'softDelete',
                                  fileId: chat.id,
                                  title: 'Move to Trash?',
                                  description: 'This will move the file to trash',
                                  actionLabel: 'Move to Trash',
                                  actionButtonClass: 'bg-red-500 hover:bg-red-600'
                                });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Link href={"/"}>Trash</Link>
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {isTrashLoading ? (
                  <>
                    <TrashSkeleton />
                    <TrashSkeleton />
                  </>
                ) : (
                  trashItems?.map((item: TrashItem) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton asChild>
                        <div className="flex">
                          <GrDocumentPdf />
                          <span className="flex-1">{item.fileName} </span>
                          <Button
                            variant="ghost"
                            onClick={() => 
                              openDialog({
                                type: 'restore',
                                fileId: item.fileId,
                                title: 'Restore File?',
                                description: 'This will restore the file from trash',
                                actionLabel: 'Restore',
                                actionButtonClass: 'bg-green-500 hover:bg-green-600'
                              })
                            }
                          >
                            {" "}
                            <TbRestore />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2"
                            onClick={(e) => {
                              e.preventDefault();
                              openDialog({
                                type: 'hardDelete',
                                fileId: item.fileId,
                                title: 'Delete Permanently?',
                                description: 'This action cannot be undone',
                                actionLabel: 'Delete Forever',
                                actionButtonClass: 'bg-red-500 hover:bg-red-600'
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
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
      <AlertDialog
        open={dialogConfig.isOpen}
        onOpenChange={closeDialog}
      >
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
    </>
  );
}
