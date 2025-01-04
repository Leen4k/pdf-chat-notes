"use client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { gradientThemes } from "@/lib/constant/gradients";
import { AppSidebar } from "@/components/sidebar/AppSidebar";

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { chatId } = useParams();

  const { data: chatData } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.get(`/api/chat/${chatId}`);
      return response.data.data;
    },
    enabled: !!chatId,
  });

  const gradientClass = chatData?.gradientId
    ? gradientThemes.find((theme) => theme.id === chatData.gradientId)?.gradient
    : "";

  return (
    <SidebarProvider>
      <div className="flex relative">
        <AppSidebar />
      </div>
      <main className={gradientClass + " dark:opacity-80"}>
        {" "}
        <SidebarTrigger variant="outline" className="ml-4 mt-4" />
        {children}
      </main>
    </SidebarProvider>
  );
}
