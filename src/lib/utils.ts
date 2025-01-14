import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "./constant/siteConfig";
import type { Metadata } from "next";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRandomColor = () => {
  // Predefined set of colors that work well for cursors
  const colors = [
    "#E57373", // Red
    "#64B5F6", // Blue
    "#81C784", // Green
    "#FFB74D", // Orange
    "#BA68C8", // Purple
    "#4DB6AC", // Teal
    "#FF8A65", // Deep Orange
    "#A1887F", // Brown
    "#90A4AE", // Blue Grey
    "#4FC3F7", // Light Blue
    "#FFF176", // Yellow
    "#FF8A80", // Red Accent
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Metadata constructor function
export function constructMetadata({
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title: {
      default: title,
      template: `%s | ${siteConfig.name}`,
    },
    description,
    keywords: [
      "AI chat",
      "real-time collaboration",
      "PDF analysis",
      "team collaboration",
      "AI assistant",
      "document chat",
      "collaborative workspace",
      "real-time editing",
      "PDF collaboration",
    ],
    authors: [
      {
        name: "Nakie",
        url: siteConfig.url,
      },
    ],
    creator: "Nak",
    publisher: "NAKIE",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteConfig.url,
      title,
      description,
      siteName: title,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${title} Preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@yourhandle",
      site: "@yourcompany",
    },
    icons: {
      icon: [
        { url: icons, sizes: "any" },
        { url: "/icon.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
      other: [
        {
          rel: "mask-icon",
          url: "/safari-pinned-tab.svg",
          color: "#000000",
        },
      ],
    },
    manifest: "/site.webmanifest",
    metadataBase: new URL(siteConfig.url),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
    },
    verification: {
      google: "your-google-site-verification",
      yandex: "your-yandex-verification",
      yahoo: "your-yahoo-verification",
    },
    category: "technology",
  };
}
