import type { ChatMessage } from "@/lib/types";
import { getTextFromMessage } from "@/lib/utils";

export type ExportableChat = {
  id: string;
  title: string;
  createdAt?: string;
  messages: ChatMessage[];
};

function formatRole(role: string) {
  if (role === "user") {
    return "User";
  }
  if (role === "assistant") {
    return "Assistant";
  }
  return role;
}

function messageToMarkdown(message: ChatMessage) {
  const text = getTextFromMessage(message).trim();
  const fileNotes = (message.parts ?? [])
    .filter((part) => part.type === "file")
    .map((part) => {
      const filePart = part as { name?: string; url?: string };
      return `- attachment: ${filePart.name ?? filePart.url ?? "file"}`;
    });

  const body = [text, ...fileNotes].filter(Boolean).join("\n\n");
  return `### ${formatRole(message.role)}\n\n${body || "_(empty)_"}`;
}

export function chatToMarkdown(chat: ExportableChat): string {
  const created = chat.createdAt ? `\n- created: ${chat.createdAt}` : "";
  const header = `# ${chat.title || "Untitled chat"}\n\n- id: ${chat.id}${created}\n`;

  if (chat.messages.length === 0) {
    return `${header}\n_No messages._\n`;
  }

  return `${header}\n${chat.messages.map(messageToMarkdown).join("\n\n")}\n`;
}

export function chatToJson(chat: ExportableChat): string {
  return `${JSON.stringify(
    {
      createdAt: chat.createdAt,
      id: chat.id,
      messages: chat.messages,
      title: chat.title,
    },
    null,
    2
  )}\n`;
}

export function slugifyChatTitle(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return slug || "chat";
}

export function downloadTextFile({
  content,
  filename,
  mimeType,
}: {
  content: string;
  filename: string;
  mimeType: string;
}) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportChat(chat: ExportableChat, format: "markdown" | "json") {
  const slug = slugifyChatTitle(chat.title);

  if (format === "json") {
    downloadTextFile({
      content: chatToJson(chat),
      filename: `${slug}.json`,
      mimeType: "application/json",
    });
    return;
  }

  downloadTextFile({
    content: chatToMarkdown(chat),
    filename: `${slug}.md`,
    mimeType: "text/markdown",
  });
}
