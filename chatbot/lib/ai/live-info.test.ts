import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LIVE_INFO_NOTICE, needsLiveInfo } from "./live-info";

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
  });
});

describe("LIVE_INFO_NOTICE", () => {
  it("tells the user to turn on the globe", () => {
    assert.match(LIVE_INFO_NOTICE, /can't access live data/);
    assert.match(LIVE_INFO_NOTICE, /globe button/);
    assert.match(LIVE_INFO_NOTICE, /won't guess/);
  });
});
