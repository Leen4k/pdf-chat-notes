"use client";
import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
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
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ChatCard } from "@/components/ChatCard";
import { GradientDialog } from "@/components/dialogs/GradientDialog";
import { SearchDialog } from "@/components/SearchDialog";
import ThemeToggler from "@/components/themes/ThemeToggler";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { useChats } from "@/hooks/useChats";
import { Chat, CreateChatInput } from "@/types/chat";

const Home = () => {
  const { userId } = useAuth();
  const isAuth = !!userId;

  // State
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatGradientId, setNewChatGradientId] = useState<number>();
  const [orderedChats, setOrderedChats] = useState<Chat[]>([]);

  // Custom hook for chat operations
  const { chats, isLoading, createChat, updateChatOrders } = useChats(isAuth);

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Effects
  useEffect(() => {
    if (chats) {
      setOrderedChats(chats);
    }
  }, [chats]);

  // Handlers
  const handleCreateChat = (data: CreateChatInput) => {
    createChat.mutate(data, {
      onSuccess: () => {
        setIsNewChatDialogOpen(false);
        setNewChatGradientId(undefined);
      },
    });
  };

  const handleDragEnd = (event: any) => {
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

        updateChatOrders.mutate(updates);
        return newOrder;
      });
    }
  };

  return (
    <div className="w-screen min-h-screen flex">
      <div className="container mx-auto p-4">
        <SignedIn>
          <Header onNewChat={() => setIsNewChatDialogOpen(true)} />
          <main className="space-y-8">
            {isLoading ? (
              <ChatSkeleton />
            ) : (
              <ChatGrid
                chats={orderedChats}
                sensors={sensors}
                onDragEnd={handleDragEnd}
              />
            )}
          </main>
        </SignedIn>

        <SignedOut>
          <SignInPrompt />
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
      </div>
    </div>
  );
};

// Component extraction
const Header = ({ onNewChat }: { onNewChat: () => void }) => (
  <div className="flex justify-between items-center">
    <div className="basis-1/2 md:basis-1/4 max-w-xl">
      <SearchDialog />
    </div>
    <div className="flex items-center gap-2">
      <Button onClick={onNewChat}>
        <PlusCircle className="mr-2 h-4 w-4" />
        New Chat
      </Button>
      <ThemeToggler />
      <UserButton afterSignOutUrl="/" />
    </div>
  </div>
);

const ChatGrid = ({
  chats,
  sensors,
  onDragEnd,
}: {
  chats: Chat[];
  sensors: any;
  onDragEnd: (event: any) => void;
}) => (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragEnd={onDragEnd}
  >
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-8 mb-4">
      <SortableContext
        items={chats.map((chat) => chat.id)}
        strategy={rectSortingStrategy}
      >
        {chats.map((chat) => (
          <ChatCard key={chat.id} chat={chat} />
        ))}
      </SortableContext>
    </div>
  </DndContext>
);

const SignInPrompt = () => (
  <div className="flex flex-col items-center gap-4">
    <p className="text-lg">Please sign in to create and view your chats.</p>
    <SignInButton>
      <Button size="lg">Sign In</Button>
    </SignInButton>
  </div>
);

export default Home;
