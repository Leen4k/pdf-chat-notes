import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import QueryWrapper from "@/lib/QueryWrapper";

const figtree = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI_PDF",
  description: "upload your own PDF as any question you want!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={figtree.className}>
          <QueryWrapper>
            <nav className="fixed flex justify-end w-screen h-10 px-8">
              <UserButton />
            </nav>
            {children}
          </QueryWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
