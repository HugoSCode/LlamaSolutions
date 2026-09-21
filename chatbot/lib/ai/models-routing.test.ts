import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GATEWAY_DEFAULT_CHAT_MODEL,
  getActiveModels,
  getDefaultChatModel,
  LMSTUDIO_DEFAULT_CHAT_MODEL,
  resolveChatModel,
  resolveModelRuntime,
} from "./models";

const gatewayKey = { AI_GATEWAY_API_KEY: "vck_live_example" };
const localOnly = { AI_GATEWAY_API_KEY: "" };
const vercel = { VERCEL: "1" };
const vercelWithKey = { AI_GATEWAY_API_KEY: "vck_live_example", VERCEL: "1" };
const localOidc = { VERCEL_OIDC_TOKEN: "oidc-token" };

describe("getActiveModels", () => {
  it("returns curated Gateway models on Vercel", () => {
    const models = getActiveModels(vercel);
    assert.ok(models.some((model) => model.id === GATEWAY_DEFAULT_CHAT_MODEL));
    assert.ok(models.some((model) => model.id === "deepseek/deepseek-v3.2"));
    assert.equal(
      models.some((model) => model.id === LMSTUDIO_DEFAULT_CHAT_MODEL),
      false
    );
  });

  it("does not list LM Studio on Vercel even when a Gateway key is set", () => {
    const models = getActiveModels(vercelWithKey);
    assert.equal(
      models.some((model) => model.id === LMSTUDIO_DEFAULT_CHAT_MODEL),
      false
    );
    assert.ok(models.every((model) => model.provider !== "lmstudio"));
  });

  it("returns the local Qwen model without Gateway", () => {
    const models = getActiveModels(localOnly);
    assert.deepEqual(
      models.map((model) => model.id),
      [LMSTUDIO_DEFAULT_CHAT_MODEL]
    );
    assert.equal(models[0]?.name.includes("Local"), true);
  });

  it("lists Gateway and Local / LM Studio together during local pnpm dev", () => {
    const models = getActiveModels(gatewayKey);
    assert.ok(models.some((model) => model.id === GATEWAY_DEFAULT_CHAT_MODEL));
    assert.ok(models.some((model) => model.id === LMSTUDIO_DEFAULT_CHAT_MODEL));
    assert.ok(
      models.some(
        (model) =>
          model.id === LMSTUDIO_DEFAULT_CHAT_MODEL &&
          model.name.includes("LM Studio")
      )
    );
  });

  it("lists both providers when OIDC is present off Vercel", () => {
    const models = getActiveModels(localOidc);
    assert.ok(models.some((model) => model.id === GATEWAY_DEFAULT_CHAT_MODEL));
    assert.ok(models.some((model) => model.id === LMSTUDIO_DEFAULT_CHAT_MODEL));
  });
});

describe("resolveChatModel", () => {
  it("uses the Gateway default when a local model id is sent on Vercel", () => {
    assert.equal(
      resolveChatModel(LMSTUDIO_DEFAULT_CHAT_MODEL, vercel),
      GATEWAY_DEFAULT_CHAT_MODEL
    );
  });

  it("keeps a curated Gateway model", () => {
    assert.equal(
      resolveChatModel("deepseek/deepseek-v3.2", vercel),
      "deepseek/deepseek-v3.2"
    );
  });

  it("allows extra LM Studio ids locally", () => {
    assert.equal(
      resolveChatModel("local-loaded-model", localOnly),
      "local-loaded-model"
    );
    assert.equal(
      resolveChatModel("local-loaded-model", gatewayKey),
      "local-loaded-model"
    );
  });

  it("remaps leftover Gateway ids to Qwen when running locally without Gateway", () => {
    assert.equal(
      resolveChatModel(GATEWAY_DEFAULT_CHAT_MODEL, localOnly),
      LMSTUDIO_DEFAULT_CHAT_MODEL
    );
  });

  it("keeps a Local / LM Studio id when a Gateway key is present locally", () => {
    assert.equal(
      resolveChatModel(LMSTUDIO_DEFAULT_CHAT_MODEL, gatewayKey),
      LMSTUDIO_DEFAULT_CHAT_MODEL
    );
  });

  it("keeps a Gateway id when a Gateway key is present locally", () => {
    assert.equal(
      resolveChatModel(GATEWAY_DEFAULT_CHAT_MODEL, gatewayKey),
      GATEWAY_DEFAULT_CHAT_MODEL
    );
  });

  it("defaults per runtime when no model is selected", () => {
    assert.equal(getDefaultChatModel(vercel), GATEWAY_DEFAULT_CHAT_MODEL);
    assert.equal(getDefaultChatModel(localOnly), LMSTUDIO_DEFAULT_CHAT_MODEL);
    assert.equal(getDefaultChatModel(gatewayKey), GATEWAY_DEFAULT_CHAT_MODEL);
  });
});

describe("resolveModelRuntime", () => {
  it("always uses Gateway on Vercel", () => {
    assert.equal(
      resolveModelRuntime(LMSTUDIO_DEFAULT_CHAT_MODEL, vercel),
      "gateway"
    );
    assert.equal(
      resolveModelRuntime(GATEWAY_DEFAULT_CHAT_MODEL, vercelWithKey),
      "gateway"
    );
  });

  it("routes by model id when Gateway is available locally", () => {
    assert.equal(
      resolveModelRuntime(LMSTUDIO_DEFAULT_CHAT_MODEL, gatewayKey),
      "lmstudio"
    );
    assert.equal(
      resolveModelRuntime(GATEWAY_DEFAULT_CHAT_MODEL, gatewayKey),
      "gateway"
    );
    assert.equal(
      resolveModelRuntime("lab-small-model", gatewayKey),
      "lmstudio"
    );
  });

  it("uses LM Studio locally when Gateway is not configured", () => {
    assert.equal(
      resolveModelRuntime(LMSTUDIO_DEFAULT_CHAT_MODEL, localOnly),
      "lmstudio"
    );
    assert.equal(resolveModelRuntime(undefined, localOnly), "lmstudio");
  });
});
