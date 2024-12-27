import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { gradientThemes } from "@/lib/gradients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ChatCardProps {
  chat: {
    id: number;
    name: string;
    createdAt: string;
    gradientId?: number;
  };
  onEditClick: (chat: any) => void;
  onDeleteClick: (chat: any) => void;
}

export function ChatCard({ chat, onEditClick, onDeleteClick }: ChatCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="hover:shadow-lg transition-shadow h-full group cursor-move"
      {...attributes}
      {...listeners}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex-1 overflow-hidden">
          <CardTitle className="truncate" title={chat.name}>
            {chat.name}
          </CardTitle>
          <CardDescription>
            Created{" "}
            {chat.createdAt
              ? format(new Date(chat.createdAt), "PPP")
              : "Unknown date"}
          </CardDescription>
        </div>
        {/* <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onClick={() => onEditClick(chat)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDeleteClick(chat)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
        </AlertDialog> */}
      </CardHeader>
      <Link href={`/chats/${chat.id}`}>
        <CardContent>
          <div
            className={`w-full h-24 rounded-md flex items-center justify-center ${
              chat.gradientId
                ? gradientThemes.find((t) => t.id === chat.gradientId)?.gradient
                : "bg-gray-100"
            }`}
          >
            <span
              className={`${
                chat.gradientId
                  ? chat.gradientId !== 1 && chat.gradientId !== 2
                    ? "text-white"
                    : "text-black dark:text-white"
                  : "text-gray-600"
              } font-medium`}
            >
              {chat.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline">
            Open Chat
          </Button>
        </CardFooter>
      </Link>
    </Card>
  );
}
