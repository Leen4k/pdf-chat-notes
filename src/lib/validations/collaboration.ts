import { z } from "zod";

export const inviteEmailSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required")
    .max(255, "Email is too long"),
});

export type InviteEmailSchema = z.infer<typeof inviteEmailSchema>;
