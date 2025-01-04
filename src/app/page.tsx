"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { PlusCircle, MoreVertical, Pencil, Trash } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import ThemeToggler from "@/components/themes/ThemeToggler";
import { GradientDialog } from "@/components/dialogs/GradientDialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { ChatCard } from "@/components/ChatCard";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useRouter } from "next/navigation";
import { CreateChatInput } from "@/lib/validations/chat";
import { SearchDialog } from "@/components/SearchDialog";

enum DialogTypes {
  EDIT = "edit",
  DELETE = "delete",
}

interface Chat {
  id: number;
  name: string;
  createdAt: string;
  thumbnailUrl?: string;
  gradientId?: number;
}

const ChatSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    ))}
  </div>
);

export default function Home() {
  const { userId } = useAuth();
  const isAuth = !!userId;
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [dialogType, setDialogType] = useState<DialogTypes | null>(null);
  const [newChatGradientId, setNewChatGradientId] = useState<
    number | undefined
  >();
  const queryClient = useQueryClient();
  const [orderedChats, setOrderedChats] = useState<Chat[]>([]);
  const router = useRouter();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await axios.get("/api/chat");
      return response.data.data;
    },
    enabled: isAuth,
  });

  useEffect(() => {
    if (chats) {
      setOrderedChats(chats);
    }
  }, [chats]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createChatMutation = useMutation({
    mutationFn: async ({
      name,
      gradientId,
    }: {
      name: string;
      gradientId?: number;
    }) => {
      const response = await axios.post("/api/chat", {
        name,
        gradientId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setNewChatName("");
      setNewChatGradientId(undefined);
      setIsNewChatDialogOpen(false);
      toast.success("Chat created successfully");
    },
    onError: () => {
      toast.error("Failed to create chat");
    },
  });

  const updateChatMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      gradientId,
    }: {
      id: number;
      name: string;
      gradientId?: number;
    }) => {
      const response = await axios.patch(`/api/chat/${id}`, {
        name,
        gradientId,
      });
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      setDialogType(null);
      setSelectedChat(null);
      toast.success("Chat updated successfully");
    },
    onError: () => {
      toast.error("Failed to update chat");
    },
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await axios.delete(`/api/chat/${id}`);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["chats"] });
      setDialogType(null);
      setSelectedChat(null);
      toast.success("Chat deleted successfully");
      router.push("/");
    },
    onError: (error) => {
      console.error(error);
      // toast.error(error.response?.data?.message);
    },
    onSettled: () => {
      router.push("/");
    },
  });

  const updateChatOrdersMutation = useMutation({
    mutationFn: async (updates: { id: number; position: number }[]) => {
      const response = await axios.patch('/api/chat/position', {
        updates,
      });
      return response.data;
    },
    onError: () => {
      toast.error("Failed to update chat order");
      if (chats) {
        setOrderedChats(chats);
      }
    },
  });

  const handleCreateChat = (data: CreateChatInput) => {
    createChatMutation.mutate({
      name: data.name,
      gradientId: data.gradientId,
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setDialogType(null);
      setSelectedChat(null);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setOrderedChats((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);

        const updates = newOrder.map((chat, index) => ({
          id: chat.id,
          position: index,
        }));

        updateChatOrdersMutation.mutate(updates);

        return newOrder;
      });
    }
  };

  return (
    <div className="w-screen min-h-screen flex">
      <div className="container mx-auto p-4">
        <SignedIn>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="basis-1/2 md:basis-1/4 max-w-xl">
                <SearchDialog />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => setIsNewChatDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Chat
                </Button>
                <ThemeToggler />
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>

            {isLoading ? (
              <ChatSkeleton />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <SortableContext
                    items={orderedChats.map((chat) => chat.id)}
                    strategy={rectSortingStrategy}
                  >
                    {orderedChats.map((chat: Chat) => (
                      <ChatCard
                        key={chat.id}
                        chat={chat}
                        onEditClick={(chat) => {
                          setSelectedChat(chat);
                          setDialogType(DialogTypes.EDIT);
                        }}
                        onDeleteClick={(chat) => {
                          setSelectedChat(chat);
                          setDialogType(DialogTypes.DELETE);
                        }}
                      />
                    ))}
                  </SortableContext>
                </div>
              </DndContext>
            )}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex flex-col items-center gap-4">
            <p className="text-lg">
              Please sign in to create and view your chats.
            </p>
            <SignInButton>
              <Button size="lg">Sign In</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <GradientDialog
          open={isNewChatDialogOpen}
          onOpenChange={setIsNewChatDialogOpen}
          title="Create New Chat"
          gradientId={newChatGradientId}
          onGradientChange={setNewChatGradientId}
          onConfirm={handleCreateChat}
          confirmText="Create"
        />

        <GradientDialog
          open={dialogType === DialogTypes.EDIT}
          onOpenChange={handleDialogChange}
          title="Edit Chat"
          name={selectedChat?.name || ""}
          onNameChange={(name) =>
            setSelectedChat((prev) => (prev ? { ...prev, name } : null))
          }
          gradientId={selectedChat?.gradientId}
          onGradientChange={(gradientId) =>
            setSelectedChat((prev) => (prev ? { ...prev, gradientId } : null))
          }
          onConfirm={() => {
            if (selectedChat) {
              updateChatMutation.mutate({
                id: selectedChat.id,
                name: selectedChat.name,
                gradientId: selectedChat.gradientId,
              });
            }
          }}
          confirmText="Save Changes"
        />

        <ConfirmationDialog
          open={dialogType === DialogTypes.DELETE}
          onOpenChange={handleDialogChange}
          title="Delete Chat"
          description={`Are you sure you want to delete "${selectedChat?.name}"? This action cannot be undone.`}
          onConfirm={() => {
            if (selectedChat) {
              deleteChatMutation.mutate(selectedChat.id);
            }
          }}
          confirmText="Delete"
          confirmVariant="destructive"
        />
      </div>
    </div>
  );
}
