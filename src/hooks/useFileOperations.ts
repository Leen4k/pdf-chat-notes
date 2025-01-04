import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-hot-toast";
import { DocumentChat } from "@/types/sidebar";

export const useFileOperations = (chatId: string) => {
  const queryClient = useQueryClient();

  const softDelete = useMutation({
    mutationFn: async (fileId: number) => {
      const { data } = await axios.post("/api/file/soft-delete", { fileId });
      return data;
    },
    onMutate: async (fileId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["documentChats", chatId] });

      // Snapshot the previous value
      const previousChats = queryClient.getQueryData(["documentChats", chatId]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[] | undefined) =>
          oldChats?.filter((chat) => parseInt(chat.id) !== fileId)
      );

      toast.loading("Moving file to trash", { id: "soft-delete" });

      return { previousChats };
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
    onError: (_, __, context) => {
      // If mutation fails, use context to roll back
      if (context?.previousChats) {
        queryClient.setQueryData(
          ["documentChats", chatId],
          context.previousChats
        );
      }
      toast.error("Failed to move file to trash", { id: "soft-delete" });
    },
  });

  const restore = useMutation({
    mutationFn: async (fileId: string) => {
      const { data } = await axios.post("/api/file/trash/restore", { fileId });
      return data;
    },
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: ["trashItems", chatId] });
      const previousTrashItems = queryClient.getQueryData([
        "trashItems",
        chatId,
      ]);

      // Optimistically remove from trash
      queryClient.setQueryData(
        ["trashItems", chatId],
        (oldItems: any[] | undefined) =>
          oldItems?.filter((item) => item.fileId !== fileId)
      );

      toast.loading("Restoring file", { id: "restore-file" });

      return { previousTrashItems };
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["documentChats", chatId] }),
        queryClient.invalidateQueries({ queryKey: ["trashItems", chatId] }),
      ]);
      toast.success(data.message, { id: "restore-file" });
    },
    onError: (_, __, context) => {
      if (context?.previousTrashItems) {
        queryClient.setQueryData(
          ["trashItems", chatId],
          context.previousTrashItems
        );
      }
      toast.error("Failed to restore file", { id: "restore-file" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documentChats", chatId] });
      queryClient.invalidateQueries({ queryKey: ["trashItems", chatId] });
    },
  });

  const rename = useMutation({
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
    onMutate: async ({ fileId, newName }) => {
      await queryClient.cancelQueries({ queryKey: ["documentChats", chatId] });
      const previousChats = queryClient.getQueryData(["documentChats", chatId]);

      // Optimistically update the file name
      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[] | undefined) =>
          oldChats?.map((chat) =>
            chat.id === fileId ? { ...chat, pdfName: newName } : chat
          )
      );

      return { previousChats };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["documentChats", chatId],
      });
      toast.success("File renamed successfully");
    },
    onError: (_, __, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(
          ["documentChats", chatId],
          context.previousChats
        );
      }
      toast.error("Failed to rename file");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documentChats", chatId] });
    },
  });

  const toggleSelection = useMutation({
    mutationFn: async ({
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
    },
    onMutate: async ({ fileId, isSelected }) => {
      await queryClient.cancelQueries({ queryKey: ["documentChats", chatId] });
      const previousChats = queryClient.getQueryData(["documentChats", chatId]);

      // Optimistically update selection
      queryClient.setQueryData(
        ["documentChats", chatId],
        (oldChats: DocumentChat[] | undefined) =>
          oldChats?.map((chat) =>
            chat.id === fileId ? { ...chat, isSelected } : chat
          )
      );

      return { previousChats };
    },
    onError: (_, __, context) => {
      if (context?.previousChats) {
        queryClient.setQueryData(
          ["documentChats", chatId],
          context.previousChats
        );
      }
      toast.error("Failed to update selection");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["documentChats", chatId] });
    },
  });

  return {
    softDelete,
    restore,
    rename,
    toggleSelection,
  };
};
