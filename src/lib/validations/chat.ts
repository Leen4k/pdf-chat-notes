import { z } from "zod";

export const createChatSchema = z.object({
  name: z
    .string()
    .min(1, "Chat name is required")
    .max(50, "Chat name must be less than 50 characters"),
  gradientId: z.number().optional(),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
