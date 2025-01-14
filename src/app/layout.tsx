import { Figtree } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import QueryWrapper from "@/lib/QueryWrapper";
import { ThemeProvider } from "@/components/themes/ThemeProvider";

const figtree = Figtree({ subsets: ["latin"] });





// Use the constructed metadata
export const metadata = constructMetadata();

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
