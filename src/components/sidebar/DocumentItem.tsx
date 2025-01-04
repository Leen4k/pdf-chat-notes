import { DocumentChat } from "@/types/sidebar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GrDocumentPdf } from "react-icons/gr";
import { TbEdit } from "react-icons/tb";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface DocumentItemProps {
  chat: DocumentChat;
  isActive: boolean;
  onRename: () => void;
  onToggleSelection: () => void;
  onDelete: () => void;
}

export const DocumentItem = ({
  chat,
  isActive,
  onRename,
  onToggleSelection,
  onDelete,
}: DocumentItemProps) => (
  <SidebarMenuItem className="relative group py-1.5">
    <SidebarMenuButton asChild>
      <Link
        className={`relative w-full flex items-center justify-between group gap-3 rounded-md py-2 ${
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
        }`}
        href={`/chats/${chat.chatId}?pdfUrl=${encodeURIComponent(chat.pdfUrl)}`}
      >
        <GrDocumentPdf className="flex-shrink-0 h-4 w-4" />
        <div className="flex-grow truncate flex items-center">
          <span className="truncate text-sm" title={chat.pdfName}>
            {chat.pdfName}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRename();
            }}
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TbEdit className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-shrink-0 flex justify-center items-center gap-2 ml-2">
          <Checkbox
            checked={chat.isSelected}
            onCheckedChange={onToggleSelection}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
);
