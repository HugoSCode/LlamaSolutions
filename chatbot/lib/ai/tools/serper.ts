export const SERPER_SEARCH_URL = "https://google.serper.dev/search";
export const SERPER_NEWS_URL = "https://google.serper.dev/news";

export const MISSING_SERPER_KEY_ERROR =
  "Set SERPER_API_KEY in .env.local to enable web search. Get a free key at https://serper.dev.";

export const EMPTY_QUERY_ERROR = "Please provide a search query.";

const PLACEHOLDER_KEYS = new Set(["", "****", "your_serper_api_key_here"]);

const BARE_URL_PATTERN =
  /^(https?:\/\/)?(www\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+([/?#].*)?$/i;

export type SerperSearchType = "search" | "news";

export type SearchResultItem = {
  title: string;
  snippet: string;
  link: string;
  source?: string;
  date?: string;
};

export type SerperSearchSuccess = {
  query: string;
  type: SerperSearchType;
  answer?: string;
  results: SearchResultItem[];
};

export type SerperSearchFailure = {
  error: string;
};

export type SerperSearchOutput = SerperSearchSuccess | SerperSearchFailure;

export type SerperSearchInput = {
  query: string;
  type?: SerperSearchType;
};

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response> | Response;

type SearchSerperOptions = {
  apiKey?: string | null;
  fetchImpl?: FetchLike;
};

type SerperOrganicItem = {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  source?: string;
};

type SerperNewsItem = {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  source?: string;
};

type SerperApiResponse = {
  organic?: SerperOrganicItem[];
  news?: SerperNewsItem[];
  answerBox?: {
    title?: string;
    answer?: string;
    snippet?: string;
    link?: string;
    source?: string;
  };
  knowledgeGraph?: {
    title?: string;
    description?: string;
    website?: string;
    descriptionSource?: string;
  };
  message?: string;
};

export function resolveSerperApiKey(
  apiKey: string | null | undefined = process.env.SERPER_API_KEY
): string | undefined {
  const trimmed = apiKey?.trim();
  if (!trimmed || PLACEHOLDER_KEYS.has(trimmed)) {
    return;
  }
  return trimmed;
}

export function buildSerperQuery(rawQuery: string): string {
  const query = rawQuery.trim().replace(/\s+/g, " ");
  if (!query) {
    return "";
  }

  if (!BARE_URL_PATTERN.test(query)) {
    return query;
  }

  try {
    const url = new URL(query.includes("://") ? query : `https://${query}`);
    const path = url.pathname === "/" ? "" : url.pathname;
    return `site:${url.hostname}${path ? ` ${path}` : ""}`.trim();
  } catch {
    return query;
  }
}

export function buildSerperRequest(
  query: string,
  type: SerperSearchType = "search"
): {
  endpoint: string;
  body: { q: string; num: number; gl: string; hl: string };
} {
  return {
    body: {
      gl: "us",
      hl: "en",
      num: 8,
      q: buildSerperQuery(query),
    },
    endpoint: type === "news" ? SERPER_NEWS_URL : SERPER_SEARCH_URL,
  };
}

function hostnameFromLink(link: string): string | undefined {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    // Invalid URLs have no hostname to show as a source.
  }
}

function toResultItem(
  item: SerperOrganicItem | SerperNewsItem
): SearchResultItem | null {
  const title = item.title?.trim();
  const link = item.link?.trim();
  if (!(title && link)) {
    return null;
  }

  return {
    date: item.date?.trim() || undefined,
    link,
    snippet: item.snippet?.trim() ?? "",
    source: item.source?.trim() || hostnameFromLink(link),
    title,
  };
}

function extractAnswer(data: SerperApiResponse): string | undefined {
  const box = data.answerBox;
  if (box) {
    const answer = [box.title, box.answer ?? box.snippet]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" — ");
    if (answer) {
      return answer;
    }
  }

  const graph = data.knowledgeGraph;
  if (graph) {
    const answer = [graph.title, graph.description]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" — ");
    if (answer) {
      return answer;
    }
  }
}

function normalizeResults(
  data: SerperApiResponse,
  type: SerperSearchType
): SearchResultItem[] {
  const rows = type === "news" ? (data.news ?? []) : (data.organic ?? []);
  const results: SearchResultItem[] = [];

  for (const row of rows) {
    const item = toResultItem(row);
    if (item) {
      results.push(item);
    }
  }

  const box = data.answerBox;
  if (
    box?.link &&
    box.title &&
    !results.some((item) => item.link === box.link)
  ) {
    const featured = toResultItem({
      date: undefined,
      link: box.link,
      snippet: box.answer ?? box.snippet ?? "",
      source: box.source,
      title: box.title,
    });
    if (featured) {
      results.unshift(featured);
    }
  }

  return results;
}

function errorFromStatus(status: number): string {
  if (status === 401 || status === 403) {
    return "Serper rejected the request. Check SERPER_API_KEY in .env.local.";
  }
  if (status === 429) {
    return "Serper rate limit reached. Try again in a moment.";
  }
  return "Web search failed. Try again in a moment.";
}

export async function searchSerper(
  input: SerperSearchInput,
  options: SearchSerperOptions = {}
): Promise<SerperSearchOutput> {
  const type = input.type ?? "search";
  const query = buildSerperQuery(input.query ?? "");

  if (!query) {
    return { error: EMPTY_QUERY_ERROR };
  }

  const apiKey = resolveSerperApiKey(
    options.apiKey === undefined ? process.env.SERPER_API_KEY : options.apiKey
  );

  if (!apiKey) {
    return { error: MISSING_SERPER_KEY_ERROR };
  }

  const { endpoint, body } = buildSerperRequest(query, type);
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    const response = await fetchImpl(endpoint, {
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      method: "POST",
    });

    if (!response.ok) {
      return { error: errorFromStatus(response.status) };
    }

    const data = (await response.json()) as SerperApiResponse;
    const results = normalizeResults(data, type);

    return {
      answer: extractAnswer(data),
      query,
      results,
      type,
    };
  } catch {
    return { error: "Web search failed. Check your network and try again." };
  }
}
