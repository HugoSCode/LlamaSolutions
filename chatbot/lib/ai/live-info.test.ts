import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  activeToolNames,
  LIVE_INFO_NOTICE,
  needsLiveInfo,
  webSearchOffPrompt,
} from "./live-info";
import { systemPrompt } from "./prompts";

describe("needsLiveInfo", () => {
  it("catches current officeholders", () => {
    assert.equal(
      needsLiveInfo("who is the current prime minister of Lithuania"),
      true
    );
    assert.equal(
      needsLiveInfo("Who is the current Prime Minister of Lithuania?"),
      true
    );
    assert.equal(needsLiveInfo("who is the president of France"), true);
    assert.equal(needsLiveInfo("current mayor of Vilnius"), true);
    assert.equal(needsLiveInfo("who's the ceo of Apple right now"), true);
  });

  it("catches news, prices, weather, sports, and recent events", () => {
    assert.equal(needsLiveInfo("what's the latest news about NVIDIA"), true);
    assert.equal(needsLiveInfo("AAPL stock price"), true);
    assert.equal(needsLiveInfo("what is the price of milk"), true);
    assert.equal(needsLiveInfo("bitcoin price"), true);
    assert.equal(needsLiveInfo("weather in Vilnius"), true);
    assert.equal(needsLiveInfo("what's the score of the football match"), true);
    assert.equal(needsLiveInfo("premier league standings"), true);
    assert.equal(needsLiveInfo("what happened today in Ukraine"), true);
    assert.equal(needsLiveInfo("recent events in Lithuania"), true);
    assert.equal(needsLiveInfo("tell me the latest"), true);
  });

  it("catches open live questions that do not name a date", () => {
    const liveQuestions = [
      "give me the latest news from australia",
      "what happened in australia",
      "What happened in Australia?",
      "what's happening",
      "what's happening in australia",
      "what is happening",
      "what's going on in australia",
      "what's going on",
      "any updates on the fires",
      "any updates on australia",
      "what happened recently",
      "what happened this week",
      "what happened yesterday",
      "what's happening tonight",
      "what's happening right now",
      "what's the latest",
      "current events in australia",
      "breaking news from australia",
      "what's breaking in australia",
    ];

    for (const question of liveQuestions) {
      assert.equal(needsLiveInfo(question), true, question);
    }
  });

  it("still answers history and general 'what happened' questions", () => {
    const historyQuestions = [
      "what happened in 1945",
      "What happened in 1945?",
      "what happened at the battle of Hastings",
      "What happened at the Battle of Hastings?",
      "what happened during World War II",
      "what happened in the Roman Empire",
    ];

    for (const question of historyQuestions) {
      assert.equal(needsLiveInfo(question), false, question);
    }
  });

  it("leaves general knowledge, history, and tasks alone", () => {
    assert.equal(needsLiveInfo("what is a prime minister"), false);
    assert.equal(
      needsLiveInfo("who was the prime minister of the UK in 1940"),
      false
    );
    assert.equal(needsLiveInfo("who won the 1966 world cup"), false);
    assert.equal(needsLiveInfo("explain photosynthesis"), false);
    assert.equal(needsLiveInfo("what is the capital of France"), false);
    assert.equal(needsLiveInfo("how does a neural network work"), false);
    assert.equal(
      needsLiveInfo("write a python function to sort a list"),
      false
    );
    assert.equal(needsLiveInfo("what is electric current in a circuit"), false);
    assert.equal(needsLiveInfo("show the current directory in linux"), false);
    assert.equal(needsLiveInfo("I'm feeling under the weather"), false);
    assert.equal(needsLiveInfo("hello"), false);
    assert.equal(needsLiveInfo("what is 2 + 2"), false);
    assert.equal(needsLiveInfo(""), false);
    assert.equal(needsLiveInfo("I recently learned to bake bread"), false);
    assert.equal(
      needsLiveInfo("what are the breaking changes in react"),
      false
    );
  });
});

describe("LIVE_INFO_NOTICE", () => {
  it("tells the user to turn on the globe", () => {
    assert.match(LIVE_INFO_NOTICE, /can't access live data/);
    assert.match(LIVE_INFO_NOTICE, /globe button/);
    assert.match(LIVE_INFO_NOTICE, /won't guess/);
  });
});

describe("webSearchOffPrompt", () => {
  it("forbids invented recent events and source links", () => {
    assert.match(webSearchOffPrompt, /Never invent recent events/);
    assert.match(webSearchOffPrompt, /Never invent source links/);
    assert.match(webSearchOffPrompt, /fake https link/);
    assert.match(webSearchOffPrompt, /No search tools are available/);
    assert.match(webSearchOffPrompt, /can't access live data/);
  });
});

describe("activeToolNames", () => {
  it("includes no search tools when the globe is off", () => {
    const names: readonly string[] = activeToolNames({
      isReasoningModel: false,
      supportsTools: true,
      webSearchEnabled: false,
    });

    assert.equal(names.includes("webSearch"), false);
    assert.equal(names.includes("searchNews"), false);
    assert.equal(names.includes("getWeather"), true);
    assert.equal(names.includes("createDocument"), true);
  });

  it("clears tools when the globe is on because search is injected as context", () => {
    assert.deepEqual(
      activeToolNames({
        isReasoningModel: false,
        supportsTools: true,
        webSearchEnabled: true,
      }),
      []
    );
  });
});

describe("systemPrompt", () => {
  it("does not instruct the model to call search or cite links when search is off", () => {
    const prompt = systemPrompt({
      liveSearch: false,
      requestHints: {
        city: "Dunedin",
        country: "NZ",
        latitude: "-45.87",
        longitude: "170.50",
      },
      supportsTools: true,
    });

    assert.equal(prompt.includes("call webSearch"), false);
    assert.equal(prompt.includes("call searchNews"), false);
    assert.equal(prompt.includes("include the source links"), false);
  });
});
