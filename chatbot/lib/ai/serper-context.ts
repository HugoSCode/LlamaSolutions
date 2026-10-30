import { fetchWebSearchContext } from "@/lib/ai/duckduckgo";

type SerperResponse = {
  answerBox?: { answer?: string; snippet?: string; title?: string };
  knowledgeGraph?: { title?: string; description?: string };
  organic?: { title?: string; link?: string; snippet?: string }[];
};

export async function fetchSearchContext(
  query: string
): Promise<{ context: string }> {
  const key = process.env.SERPER_API_KEY;
  if (!key) {
    return fetchWebSearchContext(query);
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 5 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      throw new Error(`Serper returned ${res.status}`);
    }

    const data = (await res.json()) as SerperResponse;
    const lines: string[] = [];

    const answer =
      data.answerBox?.answer ??
      data.answerBox?.snippet ??
      data.knowledgeGraph?.description;
    if (answer) {
      lines.push(`Direct answer: ${answer}`);
    }
    for (const r of (data.organic ?? []).slice(0, 5)) {
      lines.push(`- ${r.title ?? ""}: ${r.snippet ?? ""} (${r.link ?? ""})`);
    }

    if (lines.length === 0) {
      return fetchWebSearchContext(query);
    }

    return {
      context: `\n\nLive web search results for "${query}":\n${lines.join(
        "\n"
      )}\n\nAnswer using these results and cite the source link. Do not call tools on this turn.`,
    };
  } catch (error) {
    console.error("serper search failed:", error);
    return fetchWebSearchContext(query);
  }
}