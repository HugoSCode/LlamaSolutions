import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAiRuntime,
  hasAiGatewayApiKey,
  isAiGatewayEnabled,
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

describe("getAiRuntime", () => {
  it("returns gateway on Vercel and lmstudio locally", () => {
    assert.equal(getAiRuntime({ VERCEL: "1" }), "gateway");
    assert.equal(getAiRuntime({}), "lmstudio");
  });
});
