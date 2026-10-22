import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatWebSearchContext,
  normalizeSearchQuery,
  parseDuckDuckGoHtml,
  parseDuckDuckGoLiteHtml,
} from "./duckduckgo";

const SAMPLE_HTML = `
<a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FPrime_Minister_of_New_Zealand&amp;rut=abc">Prime Minister of New Zealand - Wikipedia</a>
<a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FPrime_Minister_of_New_Zealand&amp;rut=abc">The <b>prime</b> minister is Christopher Luxon.</a>
<a href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fother&amp;rut=def" class="result__a">Ignored when the first pattern matches</a>
<a class="result__snippet">unused</a>
`;

const HREF_FIRST_HTML = `
<a rel="nofollow" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fstory&amp;rut=abc" class="result__a">Example story</a>
<a class="result__snippet" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fstory">A short snippet.</a>
`;

describe("parseDuckDuckGoLiteHtml", () => {
  it("reads lite result rows", () => {
    const html = `
<a rel="nofollow" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FPrime_Minister_of_New_Zealand&amp;rut=abc" class='result-link'>Prime Minister of New Zealand - Wikipedia</a>
<td class='result-snippet'>Christopher Luxon took office on 27 November 2023.</td>
`;
    const results = parseDuckDuckGoLiteHtml(html);
    assert.equal(results.length, 1);
    assert.equal(
      results[0]?.url,
      "https://en.wikipedia.org/wiki/Prime_Minister_of_New_Zealand"
    );
    assert.equal(
      results[0]?.title,
      "Prime Minister of New Zealand - Wikipedia"
    );
    assert.match(results[0]?.snippet ?? "", /Christopher Luxon/);
  });
});

describe("parseDuckDuckGoHtml", () => {
  it("reads titles, decoded urls, and snippets", () => {
    const results = parseDuckDuckGoHtml(SAMPLE_HTML);
    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      snippet: "The prime minister is Christopher Luxon.",
      title: "Prime Minister of New Zealand - Wikipedia",
      url: "https://en.wikipedia.org/wiki/Prime_Minister_of_New_Zealand",
    });
  });

  it("accepts href before class", () => {
    const results = parseDuckDuckGoHtml(HREF_FIRST_HTML);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.url, "https://example.com/story");
    assert.equal(results[0]?.title, "Example story");
  });

  it("returns nothing for an empty page", () => {
    assert.deepEqual(parseDuckDuckGoHtml("<html></html>"), []);
  });
});

describe("formatWebSearchContext", () => {
  it("tells the model to cite fetched results", () => {
    const context = formatWebSearchContext("nz pm", [
      {
        snippet: "Christopher Luxon",
        title: "Prime Minister",
        url: "https://example.com/pm",
      },
    ]);
    assert.match(context, /https:\/\/example\.com\/pm/);
    assert.match(context, /full https URL/);
    assert.match(context, /Do not call tools on this turn/);
  });

  it("says when search returned nothing", () => {
    const context = formatWebSearchContext("nz pm", []);
    assert.match(context, /returned no results/);
  });
});

describe("normalizeSearchQuery", () => {
  it("collapses whitespace and caps length", () => {
    assert.equal(normalizeSearchQuery("  a   b  "), "a b");
    assert.equal(normalizeSearchQuery(`x${"y".repeat(400)}`).length, 300);
  });
});
