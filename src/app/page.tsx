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
import { Card } from "@/components/ui/card";
import CursorBlinker from "@/components/CursorBlinker";
import RedoAnimText from "@/components/RedoAnimation";
import { gradientThemes } from "@/lib/constant/gradients";

const Home = () => {
  const { userId } = useAuth();
  const isAuth = !!userId;

  // State
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatGradientId, setNewChatGradientId] = useState<number>();
  const [orderedChats, setOrderedChats] = useState<Chat[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Custom hook for chat operations
  const { chats, isLoading, createChat, updateChatOrders } = useChats(isAuth);

  // Handle mouse move for spotlight effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    document.documentElement.style.setProperty("--x", `${clientX}px`);
    document.documentElement.style.setProperty("--y", `${clientY}px`);
  };

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
    <div
      className="w-screen min-h-screen flex relative"
      onMouseMove={handleMouseMove}
    >
      {/* Add the spotlight gradient layer */}
      <div className="spotlight-gradient" />

      {/* Existing content with relative positioning */}
      <div className="container mx-auto p-4 relative z-10">
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

const MarqueeCard = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  const randomGradient =
    gradientThemes[Math.floor(Math.random() * (gradientThemes.length - 2)) + 2]
      .gradient;

  return (
    <Card
      key={title}
      className="flex flex-col py-4 rounded-lg border bg-card hover:scale-105 transition-transform duration-300 hover:shadow-lg min-w-[400px]"
    >
      <h3
        className={`font-semibold ${randomGradient} bg-clip-text text-transparent`}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};

const SignInPrompt = () => {
  const firstRowFeatures = [
    {
      title: "Organize Chats",
      description: "Create and manage multiple AI conversations with ease",
    },
    {
      title: "Drag & Drop",
      description: "Arrange your chats in any order you prefer",
    },
    {
      title: "Custom Themes",
      description: "Personalize your experience with different themes",
    },
    {
      title: "Real-time Collaboration",
      description: "Share and collaborate on AI conversations with your team",
    },
  ];

  const secondRowFeatures = [
    {
      title: "Smart Search",
      description: "Quickly find any conversation with powerful search",
    },
    {
      title: "PDF Support",
      description: "Upload and discuss PDFs with AI assistance",
    },
    {
      title: "Multi-User Editing",
      description: "Edit and collaborate in real-time with team members",
    },
    {
      title: "Export Options",
      description: "Export your conversations in multiple formats",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8">
      <div className="absolute top-4 right-4">
        <ThemeToggler />
      </div>
      <div className="flex flex-col gap-4 relative leading-loose">
        <h1 className="text-balance font-urban text-4xl font-extrabold sm:text-5xl md:text-6xl lg:text-[66px]">
          <span className="inline-block">Welcome To</span>{" "}
        </h1>

        <span className="relative inline-block text-balance font-urban text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[66px]">
          <RedoAnimText delay={1} text="AI REALTIME CHATS" />
          <CursorBlinker />
        </span>
        <p className="text-xl text-muted-foreground tracking-widest">
          Create, manage, and organize your AI conversations in one place. Join
          us to get started!
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3">
          <SignInButton>
            <Button className="px-8 py-6">Sign In to Get Started</Button>
          </SignInButton>
          {/* <p className="text-sm text-muted-foreground">
            No account? You can create one when signing in.
          </p> */}
        </div>
      </div>

      <div className="overflow-hidden w-full relative space-y-6">
        <div className="grid grid-cols-4 animate-marquee-left">
          {firstRowFeatures.map((feature) => (
            <MarqueeCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        <div className="grid grid-cols-4 animate-marquee-right">
          {secondRowFeatures.map((feature) => (
            <MarqueeCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute -inset-y-10 left-0 w-1/3 bg-gradient-to-r from-background/80 via-background/50 to-transparent h-screen"></div>
        <div className="pointer-events-none absolute -inset-y-10 right-0 w-1/3 bg-gradient-to-l from-background/80 via-background/50 to-transparent h-screen"></div>
      </div>
    </div>
  );
};

export default Home;
