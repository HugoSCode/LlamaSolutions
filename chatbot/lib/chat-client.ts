import { type ExportableChat, exportChat } from "@/lib/export-chat";
import {
  getLocalChat,
  localChatToChat,
  upsertLocalChat,
} from "@/lib/local-chats";
import type { ChatMessage } from "@/lib/types";

const apiBase = () => process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export async function renameChat({
  chatId,
  isLocal,
  title,
}: {
  chatId: string;
  isLocal: boolean;
  title: string;
}) {
  const nextTitle = title.trim() || "New chat";

  if (isLocal) {
    await renameLocalOnly(chatId, nextTitle);
    return nextTitle;
  }

  const response = await fetch(`${apiBase()}/api/history`, {
    body: JSON.stringify({ id: chatId, title: nextTitle }),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

  if (!response.ok) {
    throw new Error("Failed to rename chat");
  }

  return nextTitle;
}

async function renameLocalOnly(chatId: string, title: string) {
  const { renameLocalChat } = await import("@/lib/local-chats");
  await renameLocalChat(chatId, title);
}

export async function deleteChatByMode({
  chatId,
  isLocal,
}: {
  chatId: string;
  isLocal: boolean;
}) {
  if (isLocal) {
    const { deleteLocalChat } = await import("@/lib/local-chats");
    await deleteLocalChat(chatId);
    return;
  }

  await fetch(`${apiBase()}/api/chat?id=${chatId}`, { method: "DELETE" });
}

export async function deleteAllChatsByMode(isLocal: boolean) {
  if (isLocal) {
    const { deleteAllLocalChats } = await import("@/lib/local-chats");
    await deleteAllLocalChats();
    return;
  }

  await fetch(`${apiBase()}/api/history`, { method: "DELETE" });
}

export async function loadExportableChat({
  chatId,
  fallback,
  isLocal,
}: {
  chatId: string;
  fallback?: ExportableChat;
  isLocal: boolean;
}): Promise<ExportableChat> {
  if (fallback?.id === chatId && fallback.messages.length > 0) {
    return fallback;
  }

  if (isLocal) {
    const local = await getLocalChat(chatId);
    if (local) {
      return {
        createdAt: local.createdAt,
        id: local.id,
        messages: local.messages,
        title: local.title,
      };
    }
  } else {
    const response = await fetch(`${apiBase()}/api/messages?chatId=${chatId}`);
    if (response.ok) {
      const data = (await response.json()) as {
        messages?: ChatMessage[];
        title?: string;
      };
      return {
        id: chatId,
        messages: data.messages ?? [],
        title: data.title ?? fallback?.title ?? "Untitled chat",
      };
    }
  }

  return (
    fallback ?? {
      id: chatId,
      messages: [],
      title: "Untitled chat",
    }
  );
}

export async function exportChatById({
  chatId,
  fallback,
  format,
  isLocal,
}: {
  chatId: string;
  fallback?: ExportableChat;
  format: "markdown" | "json";
  isLocal: boolean;
}) {
  const chat = await loadExportableChat({ chatId, fallback, isLocal });
  exportChat(chat, format);
}

export async function copyChatToLocal({
  chatId,
  messages,
  title,
}: {
  chatId: string;
  messages: ChatMessage[];
  title: string;
}) {
  await upsertLocalChat({ id: chatId, messages, title });
  return localChatToChat({
    createdAt: new Date().toISOString(),
    id: chatId,
    messages,
    title,
    updatedAt: new Date().toISOString(),
    visibility: "private",
  });
}

export async function copyChatToCloud({
  chatId,
  messages,
  title,
}: {
  chatId: string;
  messages: ChatMessage[];
  title: string;
}) {
  const response = await fetch(`${apiBase()}/api/history`, {
    body: JSON.stringify({
      id: chatId,
      messages: messages.map((message) => ({
        createdAt: message.metadata?.createdAt,
        id: message.id,
        parts: message.parts,
        role: message.role,
      })),
      title,
      visibility: "private",
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to copy chat to cloud");
  }
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(String(reader.result));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read file"));
    };
    reader.readAsDataURL(file);
  });
}
