"use client";

import type { ToolUIPart } from "ai";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from "@/components/ai-elements/tool";
import type { SerperSearchOutput } from "@/lib/ai/tools/serper";

const SEARCH_TOOL_TITLES = {
  "tool-searchNews": "News Search",
  "tool-webSearch": "Web Search",
} as const;

type SearchToolType = keyof typeof SEARCH_TOOL_TITLES;

export type SearchToolViewPart = {
  type: SearchToolType;
  state: ToolUIPart["state"];
  toolCallId: string;
  input?: ToolUIPart["input"];
  output?: SerperSearchOutput;
};

function isMissingKeyError(output: SerperSearchOutput | undefined): boolean {
  return Boolean(
    output && "error" in output && output.error.includes("SERPER_API_KEY")
  );
}

function SearchResultList({ output }: { output: SerperSearchOutput }) {
  if ("error" in output) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
        {output.error}
      </div>
    );
  }

  if (output.results.length === 0 && !output.answer) {
    return (
      <div className="px-4 py-3 text-muted-foreground text-sm">
        No results found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {output.answer ? (
        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-sm">
          <div className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Snapshot
          </div>
          <p className="text-foreground">{output.answer}</p>
        </div>
      ) : null}

      <ul className="flex flex-col gap-2">
        {output.results.map((result) => (
          <li
            className="rounded-lg border border-border/50 bg-card/60 px-3 py-2"
            key={result.link}
          >
            <a
              className="inline-flex items-start gap-1.5 font-medium text-sm text-primary hover:underline"
              href={result.link}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span>{result.title}</span>
              <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0" />
            </a>
            {result.snippet ? (
              <p className="mt-1 text-muted-foreground text-sm">
                {result.snippet}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap gap-x-2 text-muted-foreground text-xs">
              {result.source ? <span>{result.source}</span> : null}
              {result.date ? <span>{result.date}</span> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SearchToolView({ part }: { part: SearchToolViewPart }) {
  const { state, type, toolCallId } = part;
  const title = SEARCH_TOOL_TITLES[type];
  const toastedKey = useRef<string | null>(null);

  useEffect(() => {
    if (state !== "output-available") {
      return;
    }
    if (!isMissingKeyError(part.output)) {
      return;
    }
    if (toastedKey.current === toolCallId) {
      return;
    }
    toastedKey.current = toolCallId;
    toast.error("Set SERPER_API_KEY in .env.local to enable web search.");
  }, [part.output, state, toolCallId]);

  if (state === "output-available" && part.output) {
    return (
      <div className="w-[min(100%,36rem)]">
        <Tool className="w-full" defaultOpen={true}>
          <ToolHeader state={state} title={title} type={type} />
          <ToolContent>
            <SearchResultList output={part.output} />
          </ToolContent>
        </Tool>
      </div>
    );
  }

  return (
    <div className="w-[min(100%,36rem)]">
      <Tool className="w-full" defaultOpen={true}>
        <ToolHeader state={state} title={title} type={type} />
        <ToolContent>
          {(state === "input-available" ||
            state === "input-streaming" ||
            state === "approval-requested") && <ToolInput input={part.input} />}
        </ToolContent>
      </Tool>
    </div>
  );
}

export function isSearchToolType(type: string): type is SearchToolType {
  return type === "tool-webSearch" || type === "tool-searchNews";
}
