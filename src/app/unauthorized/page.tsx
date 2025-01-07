import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
      <p className="text-lg text-gray-600 mb-6">
        Sorry, you don't have permission to access this chat.
      </p>
      <Button asChild>
        <Link href="/">Return to Chats</Link>
      </Button>
    </div>
  );
}
