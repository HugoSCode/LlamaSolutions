import { tool } from "ai";
import { z } from "zod";
import { searchSerper } from "./serper";

export const webSearch = tool({
  description:
    "Search the live web for current facts. Use this for stock prices (e.g. AAPL), website lookups, 'search X', and general Google-style questions. Do not invent live facts — call this tool. For a specific site, include the URL or domain in the query.",
  execute: async ({ query }) => searchSerper({ query, type: "search" }),
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search query, e.g. 'AAPL stock price', 'site:otago.ac.nz exam dates', or 'weather Dunedin this week'"
      ),
  }),
});

export const searchNews = tool({
  description:
    "Search Google News for the latest headlines and articles. Use this when the user asks for news, what happened today, or recent coverage of a company or topic. Do not invent headlines — call this tool.",
  execute: async ({ query }) => searchSerper({ query, type: "news" }),
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "News search query, e.g. 'NVIDIA' or 'latest news about New Zealand'"
      ),
  }),
});
