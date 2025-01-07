import { useState, useEffect } from "react";
import { useStorage } from "@/liveblocks.config";
import axios from "axios";

export const useEditorState = (chatId: string) => {
  const [isInitialContentSet, setIsInitialContentSet] = useState(false);
  const content = useStorage((root) => root.content);
  const isStorageLoading = useStorage((root) => root.content === undefined);

  const saveToDatabase = async (content: string) => {
    try {
      await axios.post("/api/editor", {
        content,
        chatId,
      });
    } catch (error) {
      console.error("Failed to save content:", error);
      throw error;
    }
  };

  return {
    content,
    isStorageLoading,
    isInitialContentSet,
    setIsInitialContentSet,
    saveToDatabase,
  };
};
