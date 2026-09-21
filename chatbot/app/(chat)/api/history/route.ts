import type { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  deleteAllChatsByUserId,
  getChatById,
  getChatsByUserId,
  saveChat,
  saveMessages,
  updateChatTitleById,
} from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

const renameSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(120),
});

const importMessageSchema = z.object({
  createdAt: z.string().optional(),
  id: z.string(),
  parts: z.unknown(),
  role: z.string(),
});

const importSchema = z.object({
  id: z.uuid(),
  messages: z.array(importMessageSchema).default([]),
  title: z.string().trim().min(1).max(120).default("New chat"),
  visibility: z.enum(["private", "public"]).default("private"),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Math.min(
    Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1),
    50
  );
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatbotError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const chats = await getChatsByUserId({
    endingBefore,
    id: session.user.id,
    limit,
    startingAfter,
  });

  return Response.json(chats);
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  const result = await deleteAllChatsByUserId({ userId: session.user.id });

  return Response.json(result, { status: 200 });
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  let body: z.infer<typeof renameSchema>;

  try {
    body = renameSchema.parse(await request.json());
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const chat = await getChatById({ id: body.id });

  if (!chat || chat.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  await updateChatTitleById({ chatId: body.id, title: body.title });

  return Response.json({ id: body.id, title: body.title });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  let body: z.infer<typeof importSchema>;

  try {
    body = importSchema.parse(await request.json());
  } catch {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const existing = await getChatById({ id: body.id });

  if (existing && existing.userId !== session.user.id) {
    return new ChatbotError("forbidden:chat").toResponse();
  }

  if (existing) {
    await updateChatTitleById({ chatId: body.id, title: body.title });
  } else {
    await saveChat({
      id: body.id,
      title: body.title,
      userId: session.user.id,
      visibility: body.visibility,
    });
  }

  if (body.messages.length > 0) {
    await saveMessages({
      messages: body.messages.map((currentMessage) => ({
        attachments: [],
        chatId: body.id,
        createdAt: currentMessage.createdAt
          ? new Date(currentMessage.createdAt)
          : new Date(),
        id: currentMessage.id,
        parts: currentMessage.parts,
        role: currentMessage.role,
      })),
    });
  }

  return Response.json({ id: body.id, title: body.title }, { status: 201 });
}
