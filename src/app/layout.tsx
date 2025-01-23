import { Figtree } from "next/font/google";
import "./globals.css";
import { ClerkProvider, GoogleOneTap } from "@clerk/nextjs";
import QueryWrapper from "@/lib/QueryWrapper";
import { ThemeProvider } from "@/components/themes/ThemeProvider";
import { constructMetadata } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"] });

// Use the constructed metadata
export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <html lang="en">
        <body className={figtree.className}>
          <GoogleOneTap
            cancelOnTapOutside={true}
            signInForceRedirectUrl="/chats"
            signUpForceRedirectUrl="/chats"
          />
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
