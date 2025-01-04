import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { gradientThemes } from "@/lib/constant/gradients";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ChatCardProps {
  chat: {
    id: number;
    name: string;
    createdAt: string;
    gradientId?: number;
  };
}

export function ChatCard({ chat }: ChatCardProps) {
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
