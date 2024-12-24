import { createClient } from "@liveblocks/client";
import { createRoomContext, createLiveblocksContext } from "@liveblocks/react";

const client = createClient({
  // publicApiKey: "",
  // authEndpoint: "/api/liveblocks-auth",
  // throttle: 100,
});

// ...

export const { RoomProvider } = createRoomContext(client);

export const {
  LiveblocksProvider,
  useInboxNotifications,

  // Other hooks
  // ...
} = createLiveblocksContext(client);