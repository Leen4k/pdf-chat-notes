import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// Create the Liveblocks client
const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Create room context
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useSelf,
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useHistory,
  useUndo,
  useRedo,
  useCanUndo,
  useCanRedo,
  useBatch,
  useStatus,
  useLostConnectionListener,
} = createRoomContext(client);

// Add TypeScript types for your Liveblocks data
declare global {
  interface Liveblocks {
    // Presence represents the public state of a user in the room
    Presence: {
      cursor: { x: number; y: number } | null;
    };

    // Storage represents the persistent data shared by all users
    Storage: {
      content: string;
      version: number;
    };

    // UserMeta represents static/public metadata about a user
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar?: string;
      };
    };

    // Customize thread metadata if needed
    ThreadMetadata: {
      resolved?: boolean;
    };
  }
}

export {};
