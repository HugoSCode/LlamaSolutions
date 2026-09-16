import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GATEWAY_DEFAULT_CHAT_MODEL,
  getActiveModels,
  getDefaultChatModel,
  LMSTUDIO_DEFAULT_CHAT_MODEL,
  resolveChatModel,
} from "./models";

describe("getActiveModels", () => {
  it("returns curated Gateway models on Vercel", () => {
    const models = getActiveModels({ VERCEL: "1" });
    assert.ok(models.some((model) => model.id === GATEWAY_DEFAULT_CHAT_MODEL));
    assert.ok(models.some((model) => model.id === "deepseek/deepseek-v3.2"));
    assert.equal(
      models.some((model) => model.id === LMSTUDIO_DEFAULT_CHAT_MODEL),
      false
    );
  });

  it("returns the local Qwen model without Gateway", () => {
    const models = getActiveModels({ AI_GATEWAY_API_KEY: "" });
    assert.deepEqual(
      models.map((model) => model.id),
      [LMSTUDIO_DEFAULT_CHAT_MODEL]
    );
  });
});

describe("resolveChatModel", () => {
  it("uses the Gateway default when a local model id is sent on Vercel", () => {
    assert.equal(
      resolveChatModel(LMSTUDIO_DEFAULT_CHAT_MODEL, { VERCEL: "1" }),
      GATEWAY_DEFAULT_CHAT_MODEL
    );
  });

  it("keeps a curated Gateway model", () => {
    assert.equal(
      resolveChatModel("deepseek/deepseek-v3.2", { VERCEL: "1" }),
      "deepseek/deepseek-v3.2"
    );
  });

  it("allows extra LM Studio ids locally", () => {
    assert.equal(
      resolveChatModel("local-loaded-model", { AI_GATEWAY_API_KEY: "" }),
      "local-loaded-model"
    );
  });

  it("remaps leftover Gateway ids to Qwen when running locally", () => {
    assert.equal(
      resolveChatModel(GATEWAY_DEFAULT_CHAT_MODEL, { AI_GATEWAY_API_KEY: "" }),
      LMSTUDIO_DEFAULT_CHAT_MODEL
    );
  });

  it("defaults per runtime when no model is selected", () => {
    assert.equal(
      getDefaultChatModel({ VERCEL: "1" }),
      GATEWAY_DEFAULT_CHAT_MODEL
    );
    assert.equal(
      getDefaultChatModel({ AI_GATEWAY_API_KEY: "" }),
      LMSTUDIO_DEFAULT_CHAT_MODEL
    );
  });
});
