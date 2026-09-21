import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chatToJson,
  chatToMarkdown,
  type ExportableChat,
  slugifyChatTitle,
} from "./export-chat";
import type { ChatMessage } from "./types";

const sampleChat: ExportableChat = {
  createdAt: "2026-09-13T00:00:00.000Z",
  id: "11111111-1111-4111-8111-111111111111",
  messages: [
    {
      id: "user-1",
      parts: [{ text: "Hello there", type: "text" }],
      role: "user",
    } as ChatMessage,
    {
      id: "assistant-1",
      parts: [{ text: "Hi — how can I help?", type: "text" }],
      role: "assistant",
    } as ChatMessage,
  ],
  title: "Greeting",
};

describe("export-chat", () => {
  it("renders markdown with roles and title", () => {
    const markdown = chatToMarkdown(sampleChat);

    assert.match(markdown, /^# Greeting/m);
    assert.match(markdown, /### User/);
    assert.match(markdown, /Hello there/);
    assert.match(markdown, /### Assistant/);
    assert.match(markdown, /Hi — how can I help\?/);
  });

  it("renders json that round-trips id and messages", () => {
    const parsed = JSON.parse(chatToJson(sampleChat)) as ExportableChat;

    assert.equal(parsed.id, sampleChat.id);
    assert.equal(parsed.title, "Greeting");
    assert.equal(parsed.messages.length, 2);
    assert.equal(parsed.messages[0]?.role, "user");
  });

  it("slugifies titles for download names", () => {
    assert.equal(slugifyChatTitle("My Chat Title!"), "my-chat-title");
    assert.equal(slugifyChatTitle("???"), "chat");
  });
});
