"use client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { gradientThemes } from "@/lib/constant/gradients";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { GeminiModelSelector } from "@/components/AIDropdown";
import {
  getCurrentModel,
  updateChatModel,
} from "@/lib/llm/gemini/gemini-model";
import { useState } from "react";

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { chatId } = useParams();
  const [currentModel, setCurrentModel] = useState("gemini-1.5-pro");

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/${chatId}`);
      return response.data.data;
    },
    enabled: !!chatId,
  });

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    updateChatModel(model);
    console.log("Current model after change:", getCurrentModel()); // Add this line
  };

  const gradientClass = chatData?.gradientId
    ? gradientThemes.find((theme) => theme.id === chatData.gradientId)?.gradient
    : "";

  return (
    <SidebarProvider>
      <div className="flex relative">
        <AppSidebar />
      </div>
      <main
        className={
          gradientClass + " dark:opacity-80 flex flex-col w-full flex-1"
        }
      >
        {" "}
        <div className="flex items-center space-x-4 ml-4 mt-4">
          <SidebarTrigger variant="outline" />
          <GeminiModelSelector
            currentModel={currentModel}
            onModelChange={handleModelChange}
          />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
