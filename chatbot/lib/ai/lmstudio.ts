import type { ChatModel } from "./models";

export type LmStudioStatus = "healthy" | "impacted" | "unknown";

export type ModelRuntimeProvider = "gateway" | "lmstudio";

export type LmStudioProbeResult = {
  status: LmStudioStatus;
  models: ChatModel[];
  provider?: ModelRuntimeProvider;
};

const DEFAULT_LMSTUDIO_BASE_URL = "http://localhost:1234/v1";
const DEFAULT_TIMEOUT_MS = 2000;

function getLmStudioBaseUrl() {
  return (process.env.LMSTUDIO_BASE_URL || DEFAULT_LMSTUDIO_BASE_URL).replace(
    /\/$/,
    ""
  );
}

function toChatModel(id: string): ChatModel {
  return {
    description: "Model loaded in LM Studio",
    id,
    name: id,
    provider: "lmstudio",
  };
}

export async function probeLmStudio(
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<LmStudioProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(`${getLmStudioBaseUrl()}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.LMSTUDIO_API_KEY || "lm-studio"}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return { models: [], status: "impacted" };
    }

    const payload = (await response.json()) as {
      data?: Array<{ id?: string }>;
    };
    const models = (payload.data ?? [])
      .map((model) => model.id?.trim())
      .filter((id): id is string => Boolean(id))
      .map(toChatModel);

    return { models, status: "healthy" };
  } catch {
    return { models: [], status: "impacted" };
  } finally {
    clearTimeout(timeout);
  }
}
