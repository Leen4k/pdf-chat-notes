import { TrashItem as TrashItemType } from "@/types/sidebar";
import { Button } from "@/components/ui/button";
import { GrDocumentPdf } from "react-icons/gr";
import { TbRestore } from "react-icons/tb";
import { Trash2 } from "lucide-react";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";

interface TrashItemProps {
  item: TrashItemType;
  onRestore: () => void;
  onDelete: () => void;
}

export const TrashItem = ({ item, onRestore, onDelete }: TrashItemProps) => (
  <SidebarMenuItem className="px-2 py-1.5">
    <SidebarMenuButton asChild>
      <div className="flex items-center gap-3">
        <GrDocumentPdf className="flex-shrink-0 h-4 w-4" />
        <span className="flex-grow truncate text-sm" title={item.fileName}>
          {item.fileName}
        </span>
        <div className="flex-shrink-0 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onRestore}
          >
            <TbRestore className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    </SidebarMenuButton>
  </SidebarMenuItem>
);
