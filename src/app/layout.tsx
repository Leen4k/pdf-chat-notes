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
import { ThemeProvider } from "@/components/themes/ThemeProvider";

const figtree = Figtree({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AI Realtime Chats - Collaborative AI Conversations",
    template: "%s | AI Realtime Chats",
  },
  description:
    "Create, manage, and collaborate on AI conversations in real-time. Upload PDFs, share insights, and work together seamlessly.",
  keywords: [
    "AI chat",
    "real-time collaboration",
    "PDF analysis",
    "team collaboration",
    "AI assistant",
    "document chat",
    "collaborative workspace",
  ],
  authors: [
    {
      name: "Nakie",
      url: "https://ai.nakie.xyz",
    },
  ],
  creator: "IT PROJECT MANAGEMENT",
  publisher: "NAKIE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ai.nakie.xyz",
    siteName: "AI Realtime Chats",
    title: "AI Realtime Chats - Collaborative AI Conversations",
    description:
      "Create, manage, and collaborate on AI conversations in real-time. Upload PDFs, share insights, and work together seamlessly.",
    images: [
      {
        url: "https://ai.nakie.xyz/og-image.png", // Make sure to add this image in public folder
        width: 1200,
        height: 630,
        alt: "AI Realtime Chats Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Realtime Chats - Collaborative AI Conversations",
    description:
      "Create, manage, and collaborate on AI conversations in real-time. Upload PDFs, share insights, and work together seamlessly.",
    images: ["/og-image.png"], // Make sure to add this image in public folder
    creator: "@yourhandle",
    site: "@yourcompany",
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon.svg", // Vector version
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png", // 180x180
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#000000", // Your brand color
      },
    ],
  },
  manifest: "/site.webmanifest", // Add a web manifest file
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: "your-google-site-verification",
    yandex: "your-yandex-verification",
    yahoo: "your-yahoo-verification",
    other: {
      "norton-safeweb-site-verification": "your-norton-verification",
    },
  },
  category: "technology",
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
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </QueryWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
