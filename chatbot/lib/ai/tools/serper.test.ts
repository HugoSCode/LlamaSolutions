import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  buildSerperQuery,
  buildSerperRequest,
  EMPTY_QUERY_ERROR,
  MISSING_SERPER_KEY_ERROR,
  resolveSerperApiKey,
  SERPER_NEWS_URL,
  SERPER_SEARCH_URL,
  searchSerper,
} from "./serper";
import { searchNews, webSearch } from "./web-search";

const originalKey = process.env.SERPER_API_KEY;

afterEach(() => {
  if (originalKey === undefined) {
    delete process.env.SERPER_API_KEY;
    return;
  }
  process.env.SERPER_API_KEY = originalKey;
});

describe("buildSerperQuery", () => {
  it("trims and collapses whitespace", () => {
    assert.equal(
      buildSerperQuery("  AAPL   stock   price  "),
      "AAPL stock price"
    );
  });

  it("turns a bare URL into a site: query", () => {
    assert.equal(
      buildSerperQuery("https://www.otago.ac.nz/study"),
      "site:www.otago.ac.nz /study"
    );
  });

  it("leaves normal questions unchanged", () => {
    assert.equal(
      buildSerperQuery("What's the latest news about NVIDIA?"),
      "What's the latest news about NVIDIA?"
    );
  });
});

describe("buildSerperRequest", () => {
  it("posts search queries to the Serper search endpoint", () => {
    const request = buildSerperRequest("AAPL stock price", "search");

    assert.equal(request.endpoint, SERPER_SEARCH_URL);
    assert.deepEqual(request.body, {
      gl: "us",
      hl: "en",
      num: 8,
      q: "AAPL stock price",
    });
  });

  it("posts news queries to the Serper news endpoint", () => {
    const request = buildSerperRequest("NVIDIA", "news");

    assert.equal(request.endpoint, SERPER_NEWS_URL);
    assert.equal(request.body.q, "NVIDIA");
  });
});

describe("resolveSerperApiKey", () => {
  it("treats empty and placeholder values as missing", () => {
    assert.equal(resolveSerperApiKey(""), undefined);
    assert.equal(resolveSerperApiKey("****"), undefined);
    assert.equal(resolveSerperApiKey("  "), undefined);
  });

  it("accepts a real-looking key", () => {
    assert.equal(resolveSerperApiKey("serper-test-key"), "serper-test-key");
  });
});

describe("searchSerper", () => {
  it("returns a clear English error when the API key is missing", async () => {
    const result = await searchSerper(
      { query: "NVIDIA" },
      {
        apiKey: "",
        fetchImpl: () => {
          throw new Error("fetch should not run without a key");
        },
      }
    );

    assert.deepEqual(result, { error: MISSING_SERPER_KEY_ERROR });
  });

  it("returns a clear English error when SERPER_API_KEY is unset", async () => {
    delete process.env.SERPER_API_KEY;

    const result = await searchSerper(
      { query: "AAPL stock price" },
      {
        fetchImpl: () => {
          throw new Error("fetch should not run without a key");
        },
      }
    );

    assert.deepEqual(result, { error: MISSING_SERPER_KEY_ERROR });
  });

  it("does not call Serper when the query is empty", async () => {
    const result = await searchSerper(
      { query: "   " },
      {
        apiKey: "serper-test-key",
        fetchImpl: () => {
          throw new Error("fetch should not run for an empty query");
        },
      }
    );

    assert.deepEqual(result, { error: EMPTY_QUERY_ERROR });
  });

  it("maps organic search hits to title, snippet, link, source, and date", async () => {
    const result = await searchSerper(
      { query: "AAPL stock price" },
      {
        apiKey: "serper-test-key",
        fetchImpl: (url, init) => {
          assert.equal(String(url), SERPER_SEARCH_URL);
          assert.equal(init?.method, "POST");
          const headers = new Headers(init?.headers);
          assert.equal(headers.get("X-API-KEY"), "serper-test-key");
          assert.equal(headers.get("Content-Type"), "application/json");

          return Response.json({
            answerBox: {
              answer: "Apple Inc. (AAPL) is trading at $226.14.",
              title: "AAPL",
            },
            organic: [
              {
                date: "2 hours ago",
                link: "https://finance.example.com/quote/AAPL",
                snippet: "Apple stock price and news.",
                title: "Apple Inc. (AAPL)",
              },
            ],
          });
        },
      }
    );

    assert.equal("error" in result, false);
    if ("error" in result) {
      return;
    }

    assert.equal(result.query, "AAPL stock price");
    assert.equal(result.type, "search");
    assert.equal(
      result.answer,
      "AAPL — Apple Inc. (AAPL) is trading at $226.14."
    );
    assert.equal(result.results.length, 1);
    assert.deepEqual(result.results[0], {
      date: "2 hours ago",
      link: "https://finance.example.com/quote/AAPL",
      snippet: "Apple stock price and news.",
      source: "finance.example.com",
      title: "Apple Inc. (AAPL)",
    });
  });

  it("maps news hits including source and date", async () => {
    const result = await searchSerper(
      { query: "NVIDIA", type: "news" },
      {
        apiKey: "serper-test-key",
        fetchImpl: (url) => {
          assert.equal(String(url), SERPER_NEWS_URL);
          return Response.json({
            news: [
              {
                date: "1 hour ago",
                link: "https://news.example.com/nvidia",
                snippet: "NVIDIA announced new chips.",
                source: "Reuters",
                title: "NVIDIA headlines",
              },
            ],
          });
        },
      }
    );

    assert.equal("error" in result, false);
    if ("error" in result) {
      return;
    }

    assert.equal(result.type, "news");
    assert.deepEqual(result.results[0], {
      date: "1 hour ago",
      link: "https://news.example.com/nvidia",
      snippet: "NVIDIA announced new chips.",
      source: "Reuters",
      title: "NVIDIA headlines",
    });
  });

  it("returns a safe error when Serper rejects the key", async () => {
    const result = await searchSerper(
      { query: "weather Dunedin" },
      {
        apiKey: "serper-test-key",
        fetchImpl: () =>
          new Response("unauthorized", {
            status: 401,
            statusText: "Unauthorized",
          }),
      }
    );

    assert.deepEqual(result, {
      error: "Serper rejected the request. Check SERPER_API_KEY in .env.local.",
    });
  });
});

describe("web search tools", () => {
  it("webSearch returns the missing-key error without throwing", async () => {
    delete process.env.SERPER_API_KEY;
    const result = await webSearch.execute?.(
      { query: "What's the latest news about NVIDIA?" },
      { context: {}, messages: [], toolCallId: "test" }
    );

    assert.deepEqual(result, { error: MISSING_SERPER_KEY_ERROR });
  });

  it("searchNews returns the missing-key error without throwing", async () => {
    delete process.env.SERPER_API_KEY;
    const result = await searchNews.execute?.(
      { query: "NVIDIA" },
      { context: {}, messages: [], toolCallId: "test" }
    );

    assert.deepEqual(result, { error: MISSING_SERPER_KEY_ERROR });
  });
});
