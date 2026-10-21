import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const entrySchema = z.object({
  name: z.string().trim().min(1).max(60),
  message: z.string().trim().min(1).max(280),
});

// Both run as the visitor through `context.getBase44()`, so the entity's access rules apply.
export const listEntries = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const entries = await context.getBase44().entities.GuestbookEntry.list("-created_date", 50);
  return entries.map(({ id, name, message, created_date }) => ({ id, name, message, created_date }));
});

export const signGuestbook = createServerFn({ method: "POST" })
  .inputValidator(entrySchema)
  .handler(async ({ data, context }) => {
    await context.getBase44().entities.GuestbookEntry.create(data);
  });
