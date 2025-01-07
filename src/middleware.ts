import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Create matchers for different routes that need protection
const isChatRoute = createRouteMatcher(["/chats/:id(.*)"]);
const isChatApiRoute = createRouteMatcher([
  "/api/chat/:id(.*)",
  "/api/chat-auth(.*)",
  // "/api/collaborate/:id(.*)",
  // "/api/search(.*)"
]);

export default clerkMiddleware((auth, req) => {
  const userId = auth().userId;

  if (req.nextUrl.pathname === "/api/chat-auth") {
    return NextResponse.next();
  }

  if (!userId && req.nextUrl.pathname !== "/") {
    // Redirect to sign-in page if not authenticated
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Check if the request is for a chat page or chat API
  if (isChatRoute(req) || isChatApiRoute(req)) {
    // Don't check auth for the chat-auth endpoint itself
    if (req.nextUrl.pathname === "/api/chat-auth") {
      return NextResponse.next();
    }

    // Extract chatId from URL for both page and API routes
    const chatId = req.nextUrl.pathname.split("/")[2];
    const baseUrl = req.nextUrl.origin;
    const authCheckUrl = `${baseUrl}/api/chat-auth?chatId=${chatId}&userId=${userId}`;

    try {
      const headers = new Headers(req.headers);
      headers.set("Authorization", req.headers.get("Authorization") || "");

      return fetch(authCheckUrl, {
        headers: headers,
      })
        .then((response) => {
          if (!response.ok) {
            // For API routes, return JSON response
            if (isChatApiRoute(req)) {
              return NextResponse.json(
                { error: "Unauthorized access" },
                { status: 403 }
              );
            }
            // For page routes, redirect to unauthorized page
            return NextResponse.redirect(new URL("/unauthorized", req.url));
          }
          return NextResponse.next();
        })
        .catch((error) => {
          console.error("Auth check error:", error);
          if (isChatApiRoute(req)) {
            return NextResponse.json(
              { error: "Internal server error" },
              { status: 500 }
            );
          }
          return NextResponse.redirect(new URL("/error", req.url));
        });
    } catch (error) {
      console.error("Middleware error:", error);
      if (isChatApiRoute(req)) {
        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
      return NextResponse.redirect(new URL("/error", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/chat-auth (auth check endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/chat-auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
