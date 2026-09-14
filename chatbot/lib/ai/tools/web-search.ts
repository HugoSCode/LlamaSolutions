import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description:
    "Search the web for current, recent, or up-to-date information. Use this when the user asks about news, current events, recent information, websites, companies, products, or anything that may have changed recently.",

  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query to send to Google Search"),
  }),

  execute: async ({ query }) => {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
      return {
        error: "SERPER_API_KEY is not configured.",
      };
    }

    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        return {
          error: `Serper API request failed (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();

      return {
        query,
        results: data.organic ?? [],
        answerBox: data.answerBox ?? null,
        knowledgeGraph: data.knowledgeGraph ?? null,
      };
    } catch (error) {
      console.error("Web search error:", error);

      return {
        error: "Failed to search the web. Please try again.",
      };
    }
  },
});
