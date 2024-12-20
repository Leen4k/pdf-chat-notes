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
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { gradientThemes } from "@/lib/gradients";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const queryClient = useQueryClient();

  const { data: chats, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const response = await axios.get("/api/chat");
      return response.data.data;
    },
    enabled: isAuth,
  });

  const createChatMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await axios.post("/api/chat/create", { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setNewChatName("");
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
      setIsEditDialogOpen(false);
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
      setIsDeleteDialogOpen(false);
      setChatToDelete(null);
      toast.success("Chat deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete chat");
    },
  });

  const handleCreateChat = () => {
    if (newChatName.trim()) {
      createChatMutation.mutate(newChatName.trim());
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedChat(null);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setChatToDelete(null);
    }
  };

  return (
    <div className="w-screen min-h-screen flex items-center">
      <div className="container mx-auto my-auto p-4">
        {/* <div className="text-center mb-8">
          <h1 className="text-5xl font-bold">Welcome to N4K's AIPDF</h1>
          <p className="text-slate-700 mt-2">
            Create and manage your conversations
          </p>
        </div> */}

        <SignedIn>
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <Button onClick={() => setIsNewChatDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Chat
              </Button>
              <UserButton afterSignOutUrl="/" />
            </div>

            {isLoading ? (
              <ChatSkeleton />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {chats?.map((chat: Chat) => (
                  <Card
                    key={chat.id}
                    className="hover:shadow-lg transition-shadow h-full group"
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
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedChat(chat);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setChatToDelete(chat);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <Link href={`/chats/${chat.id}`}>
                      <CardContent>
                        <div
                          className={`w-full h-24 rounded-md flex items-center justify-center ${
                            chat.gradientId
                              ? gradientThemes.find(
                                  (t) => t.id === chat.gradientId
                                )?.gradient
                              : "bg-gray-100"
                          }`}
                        >
                          <span
                            className={`${
                              chat.gradientId ? "text-white" : "text-gray-600"
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
                ))}
              </div>
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

        {/* Dialogs */}
        <AlertDialog
          open={isNewChatDialogOpen}
          onOpenChange={setIsNewChatDialogOpen}
        >
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Chat</AlertDialogTitle>
              <AlertDialogDescription>
                <Input
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Enter chat name"
                  className="mt-2"
                  autoFocus
                />
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction type="button" onClick={handleCreateChat}>
                Create
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogChange}
        >
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Chat</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="space-y-4">
                  <Input
                    value={selectedChat?.name || ""}
                    onChange={(e) =>
                      setSelectedChat((prev) =>
                        prev ? { ...prev, name: e.target.value } : null
                      )
                    }
                    placeholder="Enter chat name"
                    autoFocus
                  />
                  <div className="grid grid-cols-5 gap-2">
                    {gradientThemes.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        className={`${
                          theme.gradient
                        } h-8 rounded-md transition-all ${
                          selectedChat?.gradientId === theme.id
                            ? "ring-2 ring-offset-2 ring-black"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedChat((prev) =>
                            prev ? { ...prev, gradientId: theme.id } : null
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                onClick={async () => {
                  if (selectedChat) {
                    await updateChatMutation.mutateAsync({
                      id: selectedChat.id,
                      name: selectedChat.name,
                      gradientId: selectedChat.gradientId,
                    });
                  }
                }}
              >
                Save Changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={handleDeleteDialogChange}
        >
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{chatToDelete?.name}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
              <AlertDialogAction
                type="button"
                onClick={async () => {
                  if (chatToDelete) {
                    await deleteChatMutation.mutateAsync(chatToDelete.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
