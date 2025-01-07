import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Chat, ChatOrderUpdate, CreateChatInput } from "@/types/chat";
import toast from "react-hot-toast";

export const useChats = (isAuth: boolean) => {
  const queryClient = useQueryClient();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await axios.get("/api/chat");
      return response.data.data;
    },
    enabled: isAuth,
  });

  const createChat = useMutation({
    mutationFn: async (data: CreateChatInput) => {
      const response = await axios.post("/api/chat", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      toast.success("Chat created successfully");
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  const updateChatOrders = useMutation({
    mutationFn: async (updates: ChatOrderUpdate[]) => {
      const response = await axios.patch("/api/chat/position", { updates });
      return response.data;
    },
    onError: (error) => {
      console.log(error);
      toast.error("Failed to update chat order");
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  return {
    chats,
    isLoading,
    createChat,
    updateChatOrders,
  };
};
