"use client";
import { Button } from "@/components/ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
import FileUpload from "@/components/ui/FileUpload";
import { db } from "@/lib/db";
import { chats, files } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import Link from "next/link";
import { TbSparkles } from "react-icons/tb";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const Page = () => {
  const { userId } = useAuth();
  const isAuth = !!userId;

  const { data: userChats = [], refetch } = useQuery({
    queryKey: ["userChats", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data: response } = await axios.get(`/api/chat`);
      console.log(response.data);
      return response.data;
    },
    enabled: !!userId,
  });

  return (
    <div className="w-screen min-h-screen text-center flex items-center justify-center">
      <div className="opacity-50 w-screen min-h-screen absolute -z-10"></div>
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl font-bold">Welcome to N4K's PDF AI</h1>
        <p className="text-slate-700">intuitive straight forward ai pdf chat</p>

        {isAuth && (
          <>
            <div className="flex flex-col gap-2">
              {/* <h2 className="text-2xl">Your PDFs</h2> */}
              {userChats.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {userChats.map((chat: any) => (
                    <Link
                      key={chat.id}
                      href={`/chats/${chat.id}`}
                      className="flex gap-2 text-sm items-center justify-center p-2 border rounded hover:bg-gray-100"
                    >
                      <TbSparkles className="text-lg font-bold" />
                      {chat.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>No PDFs uploaded yet</p>
              )}
            </div>
            <FileUpload />
          </>
        )}

        <SignedOut>
          <div>
            <SignInButton>
              <Button>Sign In</Button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export default Page;
