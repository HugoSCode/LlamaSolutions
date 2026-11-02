/** Serper (and any other) web search tools. These must not be offered when the globe is off. */
export const SEARCH_TOOL_NAMES = ["webSearch", "searchNews"] as const;

const NON_SEARCH_TOOL_NAMES = [
  "getWeather",
  "createDocument",
  "editDocument",
  "updateDocument",
  "requestSuggestions",
] as const;

export type NonSearchToolName = (typeof NON_SEARCH_TOOL_NAMES)[number];

export function selectActiveTools({
  isReasoningModel,
  supportsTools,
  webSearchEnabled,
}: {
  isReasoningModel: boolean;
  supportsTools: boolean;
  webSearchEnabled: boolean;
}): NonSearchToolName[] {
  if (webSearchEnabled || (isReasoningModel && !supportsTools)) {
    return [];
  }

  return [...NON_SEARCH_TOOL_NAMES];
}
