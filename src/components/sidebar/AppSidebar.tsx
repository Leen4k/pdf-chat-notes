"use client";
import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import { IoIosArrowBack } from "react-icons/io";
import { useFileOperations } from "@/hooks/useFileOperations";
import { DocumentItem } from "./DocumentItem";
import { TrashItem } from "./TrashItem";

import { DialogConfig, DocumentChat, RenameDialogState } from "@/types/sidebar";
import FileUpload from "@/components/ui/FileUpload";
import { RenameDialog } from "@/components/dialogs/RenameDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ChatHeader } from "./ChatHeader";
import { ChatSkeleton, TrashSkeleton } from "../skeletons/Skeletons";
import { Chat } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { CollaborationSection } from "./CollaborationSection";

export function AppSidebar() {
  const { userId } = useAuth();
  const { chatId } = useParams();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPdfUrl = searchParams.get("pdfUrl");

  // State
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

  // Queries
  const { data: chatData, refetch: refetchChat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/${chatId}`);
      return response.data.data;
    },
    enabled: !!chatId,
    staleTime: 0,
  });

  const { data: documentChats, isLoading: isChatsLoading } = useQuery({
    queryKey: ["documentChats", chatId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/file?chatId=${chatId}`);
      return data.pdf;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: trashItems, isLoading: isTrashLoading } = useQuery({
    queryKey: ["trashItems", chatId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/file/trash?chatId=${chatId}`);
      return data.data;
    },
    refetchInterval: 5000,
  });

  // Custom hooks
  const { softDelete, restore, rename, toggleSelection } = useFileOperations(
    chatId as string
  );

  // Handlers
  const handleDialogAction = () => {
    if (!dialogConfig.fileId) return;

    switch (dialogConfig.type) {
      case "softDelete":
        softDelete.mutate(parseInt(dialogConfig.fileId));
        break;
      case "restore":
        restore.mutate(dialogConfig.fileId);
        break;
      case "hardDelete":
        deleteFileMutation.mutate(dialogConfig.fileId);
        break;
    }
  };

  const isActiveFile = (fileUrl: string) => {
    if (!currentPdfUrl) return false;
    try {
      return decodeURIComponent(currentPdfUrl) === decodeURIComponent(fileUrl);
    } catch {
      return currentPdfUrl === fileUrl;
    }
  };

  const onUploadComplete = (newFile: any) => {
    queryClient.setQueryData(
      ["documentChats", chatId],
      (oldData: any[] | undefined) => {
        if (!oldData) return [newFile];
        return [...oldData, newFile];
      }
    );

    queryClient.invalidateQueries({
      queryKey: ["documentChats", chatId],
    });

    toast.success("File uploaded successfully");
  };

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

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await axios.delete("/api/file", {
        data: { fileId },
      });
      return response.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["documentChats", chatId],
          exact: true,
        }),
        queryClient.invalidateQueries({
          queryKey: ["trashItems", chatId],
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: ["documentChats", chatId],
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: ["trashItems", chatId],
          exact: true,
        }),
      ]);
      toast.success(data.message);
      closeDialog();
    },
    onError: () => {
      toast.error("Failed to delete file");
    },
  });

  return (
    <>
      <Sidebar>
        <SidebarContent>
          <ChatHeader chatData={chatData} />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {isChatsLoading ? (
                  <ChatSkeleton count={3} />
                ) : documentChats?.length === 0 ? (
                  <EmptyState message="No PDF files uploaded yet" />
                ) : (
                  documentChats?.map((chat: DocumentChat, index: number) => (
                    <DocumentItem
                      key={chat.id}
                      chat={chat}
                      isActive={isActiveFile(chat.pdfUrl)}
                      onRename={() =>
                        setRenameDialog({
                          isOpen: true,
                          fileId: chat.id,
                          currentName: chat.pdfName,
                        })
                      }
                      onToggleSelection={() =>
                        toggleSelection.mutate({
                          fileId: chat.id,
                          isSelected: !chat.isSelected,
                        })
                      }
                      onDelete={() =>
                        openDialog({
                          type: "softDelete",
                          fileId: chat.id,
                          title: "Move to Trash?",
                          description: "This will move the file to trash",
                          actionLabel: "Move to Trash",
                          actionButtonClass: "bg-red-500 hover:bg-red-600",
                        })
                      }
                      index={index}
                    />
                  ))
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
              <SidebarMenu className="space-y-1">
                {isTrashLoading ? (
                  <TrashSkeleton count={2} />
                ) : trashItems?.length === 0 ? (
                  <EmptyState message="Trash is empty" />
                ) : (
                  trashItems?.map((item) => (
                    <TrashItem
                      key={item.id}
                      item={item}
                      onRestore={() =>
                        openDialog({
                          type: "restore",
                          fileId: item.fileId,
                          title: "Restore File?",
                          description: "This will restore the file from trash",
                          actionLabel: "Restore",
                          actionButtonClass: "bg-green-500 hover:bg-green-600",
                        })
                      }
                      onDelete={() =>
                        openDialog({
                          type: "hardDelete",
                          fileId: item.fileId,
                          title: "Delete Permanently?",
                          description: "This action cannot be undone",
                          actionLabel: "Delete Forever",
                          actionButtonClass: "bg-red-500 hover:bg-red-600",
                        })
                      }
                    />
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <CollaborationSection chatId={chatId as string} />
        </SidebarContent>
      </Sidebar>

      <ConfirmationDialog
        open={dialogConfig.isOpen}
        onOpenChange={closeDialog}
        title={dialogConfig.title}
        description={dialogConfig.description}
        onConfirm={handleDialogAction}
        confirmText={dialogConfig.actionLabel}
        confirmButtonClass={dialogConfig.actionButtonClass}
      />

      <RenameDialog
        open={renameDialog.isOpen}
        onOpenChange={(open) =>
          !open && setRenameDialog((prev) => ({ ...prev, isOpen: false }))
        }
        currentName={renameDialog.currentName}
        onRename={(newName) => {
          if (renameDialog.fileId && newName.trim()) {
            rename.mutate({
              fileId: renameDialog.fileId,
              newName: newName.trim(),
            });
            setRenameDialog({
              isOpen: false,
              fileId: null,
              currentName: "",
            });
          }
        }}
      />
    </>
  );
}
