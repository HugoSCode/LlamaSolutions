import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SEARCH_TOOL_NAMES, selectActiveTools } from "./active-tools";

describe("selectActiveTools", () => {
  it("drops every search tool when web search is off", () => {
    const names: readonly string[] = selectActiveTools({
      isReasoningModel: false,
      supportsTools: true,
      webSearchEnabled: false,
    });

    for (const searchTool of SEARCH_TOOL_NAMES) {
      assert.equal(names.includes(searchTool), false);
    }
    assert.equal(names.includes("getWeather"), true);
    assert.equal(names.includes("createDocument"), true);
  });

  it("offers no tools when the globe is on", () => {
    assert.deepEqual(
      selectActiveTools({
        isReasoningModel: false,
        supportsTools: true,
        webSearchEnabled: true,
      }),
      []
    );
  });

  it("offers no tools for a reasoning model that cannot use tools", () => {
    assert.deepEqual(
      selectActiveTools({
        isReasoningModel: true,
        supportsTools: false,
        webSearchEnabled: false,
      }),
      []
    );
  });
});
