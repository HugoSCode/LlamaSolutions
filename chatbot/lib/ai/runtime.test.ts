import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canUseLmStudio,
  getAiRuntime,
  hasAiGatewayApiKey,
  isAiGatewayEnabled,
  isOnVercel,
} from "./runtime";

describe("hasAiGatewayApiKey", () => {
  it("treats empty and placeholder values as missing", () => {
    assert.equal(hasAiGatewayApiKey(undefined), false);
    assert.equal(hasAiGatewayApiKey(""), false);
    assert.equal(hasAiGatewayApiKey("   "), false);
    assert.equal(hasAiGatewayApiKey("****"), false);
  });

  it("accepts a real-looking key", () => {
    assert.equal(hasAiGatewayApiKey("vck_live_example"), true);
  });
});

describe("isAiGatewayEnabled", () => {
  it("is on when Vercel is set", () => {
    assert.equal(isAiGatewayEnabled({ VERCEL: "1" }), true);
  });

  it("is on when OIDC token is present", () => {
    assert.equal(isAiGatewayEnabled({ VERCEL_OIDC_TOKEN: "oidc-token" }), true);
  });

  it("is on when AI_GATEWAY_API_KEY is set", () => {
    assert.equal(
      isAiGatewayEnabled({ AI_GATEWAY_API_KEY: "vck_live_example" }),
      true
    );
  });

  it("stays off for local LM Studio when gateway env is empty", () => {
    assert.equal(
      isAiGatewayEnabled({
        AI_GATEWAY_API_KEY: "****",
        LMSTUDIO_BASE_URL: "http://127.0.0.1:1234/v1",
      }),
      false
    );
  });
});

describe("isOnVercel / canUseLmStudio", () => {
  it("treats only VERCEL as the cloud deploy", () => {
    assert.equal(isOnVercel({ VERCEL: "1" }), true);
    assert.equal(canUseLmStudio({ VERCEL: "1" }), false);
    assert.equal(isOnVercel({ AI_GATEWAY_API_KEY: "vck_live_example" }), false);
    assert.equal(
      canUseLmStudio({ AI_GATEWAY_API_KEY: "vck_live_example" }),
      true
    );
    assert.equal(isOnVercel({ VERCEL_OIDC_TOKEN: "oidc-token" }), false);
    assert.equal(canUseLmStudio({}), true);
  });
});

describe("getAiRuntime", () => {
  it("returns gateway on Vercel and lmstudio locally", () => {
    assert.equal(getAiRuntime({ VERCEL: "1" }), "gateway");
    assert.equal(getAiRuntime({}), "lmstudio");
  });

  it("defaults to gateway locally when a Gateway key exists (picker still includes LM Studio)", () => {
    assert.equal(
      getAiRuntime({ AI_GATEWAY_API_KEY: "vck_live_example" }),
      "gateway"
    );
  });
});
