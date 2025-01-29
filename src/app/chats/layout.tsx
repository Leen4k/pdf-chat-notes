"use client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { gradientThemes } from "@/lib/constant/gradients";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { ModelSelector } from "@/components/AIDropdown";
import { updateLLMProvider, getCurrentConfig, LLMProvider } from "@/lib/llm";
import { useState, useEffect } from "react";

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { chatId } = useParams();
  const [config, setConfig] = useState(getCurrentConfig());

  // Sync with LLM factory state
  useEffect(() => {
    const currentConfig = getCurrentConfig();
    if (
      currentConfig.provider !== config.provider ||
      currentConfig.model !== config.model
    ) {
      setConfig(currentConfig);
    }
  }, [config.provider, config.model]);

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/${chatId}`);
      return response.data.data;
    },
    enabled: !!chatId,
  });

  const handleConfigChange = (provider: LLMProvider, model: string) => {
    console.log(`Switching to ${provider} model: ${model}`);
    updateLLMProvider(provider, model);
    setConfig(getCurrentConfig());
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
          <ModelSelector
            currentConfig={config}
            onConfigChange={handleConfigChange}
          />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
