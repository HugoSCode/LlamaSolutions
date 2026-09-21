import { probeLmStudio } from "./lmstudio";
import { type AiRuntime, isAiGatewayEnabled, isOnVercel } from "./runtime";

export const GATEWAY_DEFAULT_CHAT_MODEL = "moonshotai/kimi-k2.5";
export const LMSTUDIO_DEFAULT_CHAT_MODEL = "qwen/qwen3-vl-4b";

/** Client initial value; server remaps to the active runtime default. */
export const DEFAULT_CHAT_MODEL = GATEWAY_DEFAULT_CHAT_MODEL;

export const gatewayTitleModel = {
  description: "Fast model for title generation",
  gatewayOrder: ["fireworks", "bedrock"],
  id: GATEWAY_DEFAULT_CHAT_MODEL,
  name: "Kimi K2.5",
  provider: "moonshotai",
};

export const lmStudioTitleModel = {
  description: "Fast local model for title generation",
  id: LMSTUDIO_DEFAULT_CHAT_MODEL,
  name: "Local / LM Studio",
  provider: "lmstudio",
};

export const titleModel = gatewayTitleModel;

export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  gatewayOrder?: string[];
  reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
};

const DEFAULT_TOOL_CAPABILITIES: ModelCapabilities = {
  reasoning: false,
  tools: true,
  vision: false,
};

export const gatewayChatModels: ChatModel[] = [
  {
    description: "Fast and capable model with tool use",
    gatewayOrder: ["bedrock", "deepinfra"],
    id: "deepseek/deepseek-v3.2",
    name: "DeepSeek V3.2",
    provider: "deepseek",
  },
  {
    description: "Moonshot AI flagship model",
    gatewayOrder: ["fireworks", "bedrock"],
    id: GATEWAY_DEFAULT_CHAT_MODEL,
    name: "Kimi K2.5",
    provider: "moonshotai",
  },
  {
    description: "Compact reasoning model",
    gatewayOrder: ["groq", "bedrock"],
    id: "openai/gpt-oss-20b",
    name: "GPT OSS 20B",
    provider: "openai",
    reasoningEffort: "low",
  },
  {
    description: "Open-source 120B parameter model",
    gatewayOrder: ["fireworks", "bedrock"],
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    provider: "openai",
    reasoningEffort: "low",
  },
  {
    description: "Fast non-reasoning model with tool use",
    gatewayOrder: ["xai"],
    id: "xai/grok-4.1-fast-non-reasoning",
    name: "Grok 4.1 Fast",
    provider: "xai",
  },
];

export const lmStudioChatModels: ChatModel[] = [
  {
    description:
      "Qwen3 VL 4B via LM Studio (school LAN or this computer). Local pnpm dev only.",
    id: LMSTUDIO_DEFAULT_CHAT_MODEL,
    name: "Local / LM Studio",
    provider: "lmstudio",
  },
];

const GATEWAY_MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  "deepseek/deepseek-v3.2": {
    reasoning: false,
    tools: true,
    vision: false,
  },
  [GATEWAY_DEFAULT_CHAT_MODEL]: {
    reasoning: true,
    tools: true,
    vision: true,
  },
  "openai/gpt-oss-20b": {
    reasoning: true,
    tools: true,
    vision: false,
  },
  "openai/gpt-oss-120b": {
    reasoning: true,
    tools: true,
    vision: false,
  },
  "xai/grok-4.1-fast-non-reasoning": {
    reasoning: false,
    tools: true,
    vision: false,
  },
};

const LMSTUDIO_MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  [LMSTUDIO_DEFAULT_CHAT_MODEL]: {
    reasoning: true,
    tools: true,
    vision: true,
  },
};

export const isDemo = process.env.IS_DEMO === "5";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

type EnvLike = Record<string, string | undefined>;

const gatewayModelIds = new Set(gatewayChatModels.map((item) => item.id));
const lmStudioModelIds = new Set(lmStudioChatModels.map((item) => item.id));

export function isLmStudioModelId(modelId: string | undefined): boolean {
  return Boolean(modelId && lmStudioModelIds.has(modelId));
}

/**
 * Provider for a selected model id. On Vercel always Gateway.
 * Locally, the id decides Gateway vs LM Studio (both can appear in the picker).
 */
export function resolveModelRuntime(
  modelId: string | undefined,
  env: EnvLike = process.env
): AiRuntime {
  if (isOnVercel(env)) {
    return "gateway";
  }

  if (isLmStudioModelId(modelId)) {
    return "lmstudio";
  }

  if (modelId && gatewayModelIds.has(modelId) && isAiGatewayEnabled(env)) {
    return "gateway";
  }

  if (modelId && !gatewayModelIds.has(modelId)) {
    return "lmstudio";
  }

  return isAiGatewayEnabled(env) ? "gateway" : "lmstudio";
}

export function getActiveModels(env: EnvLike = process.env): ChatModel[] {
  if (isOnVercel(env)) {
    return gatewayChatModels;
  }

  if (isAiGatewayEnabled(env)) {
    return [...gatewayChatModels, ...lmStudioChatModels];
  }

  return lmStudioChatModels;
}

export function getDefaultChatModel(env: EnvLike = process.env): string {
  return isAiGatewayEnabled(env)
    ? GATEWAY_DEFAULT_CHAT_MODEL
    : LMSTUDIO_DEFAULT_CHAT_MODEL;
}

export function getTitleModelConfig(env: EnvLike = process.env): ChatModel {
  return isAiGatewayEnabled(env) ? gatewayTitleModel : lmStudioTitleModel;
}

export function resolveChatModel(
  modelId: string | undefined,
  env: EnvLike = process.env
): string {
  const active = getActiveModels(env);
  if (modelId && active.some((item) => item.id === modelId)) {
    return modelId;
  }

  if (isOnVercel(env)) {
    return getDefaultChatModel(env);
  }

  // Local LM Studio can serve any model currently loaded in the lab server.
  if (modelId && !gatewayModelIds.has(modelId)) {
    return modelId;
  }

  return getDefaultChatModel(env);
}

export const chatModels: ChatModel[] = gatewayChatModels;

export const allowedModelIds = new Set(
  [...gatewayChatModels, ...lmStudioChatModels].map((model) => model.id)
);

export const modelsByProvider = [
  ...gatewayChatModels,
  ...lmStudioChatModels,
].reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }

    acc[model.provider].push(model);

    return acc;
  },
  {} as Record<string, ChatModel[]>
);

function capabilitiesForModel(model: ChatModel): ModelCapabilities {
  const table =
    model.provider === "lmstudio"
      ? LMSTUDIO_MODEL_CAPABILITIES
      : GATEWAY_MODEL_CAPABILITIES;
  return table[model.id] ?? DEFAULT_TOOL_CAPABILITIES;
}

export async function getCapabilities(
  env: EnvLike = process.env
): Promise<Record<string, ModelCapabilities>> {
  const models = getActiveModels(env);
  const defaults = Object.fromEntries(
    models.map((model) => [model.id, capabilitiesForModel(model)])
  );

  const gatewayModels = models.filter((model) => model.provider !== "lmstudio");

  if (gatewayModels.length === 0) {
    return defaults;
  }

  const results = await Promise.all(
    gatewayModels.map(async (model) => {
      try {
        const res = await fetch(
          `https://ai-gateway.vercel.sh/v1/models/${model.id}/endpoints`,
          { next: { revalidate: 86_400 } }
        );
        if (!res.ok) {
          return [model.id, defaults[model.id]] as const;
        }

        const json = await res.json();
        const endpoints = json.data?.endpoints ?? [];
        const params = new Set(
          endpoints.flatMap(
            (endpoint: { supported_parameters?: string[] }) =>
              endpoint.supported_parameters ?? []
          )
        );
        const inputModalities = new Set(
          json.data?.architecture?.input_modalities ?? []
        );

        return [
          model.id,
          {
            reasoning: params.has("reasoning"),
            tools: params.has("tools") || defaults[model.id].tools,
            vision: inputModalities.has("image"),
          },
        ] as const;
      } catch {
        return [model.id, defaults[model.id]] as const;
      }
    })
  );

  return { ...defaults, ...Object.fromEntries(results) };
}

export type ModelAvailability = "healthy" | "impacted" | "unknown";

type GatewayEndpoint = {
  provider_name?: string;
  status?: number;
  uptime_last_15m?: number;
  uptime_last_1h?: number;
  latency_last_1h?: {
    p50?: number;
    p95?: number;
  };
};

const PROVIDER_IMPACTED_UPTIME_THRESHOLD = 99;
const PROVIDER_IMPACTED_P50_MS = 10_000;
const PROVIDER_IMPACTED_P95_MS = 30_000;

function isEndpointImpacted(endpoint: GatewayEndpoint) {
  return (
    (endpoint.status !== undefined && endpoint.status !== 0) ||
    (endpoint.uptime_last_15m !== undefined &&
      endpoint.uptime_last_15m < PROVIDER_IMPACTED_UPTIME_THRESHOLD) ||
    (endpoint.uptime_last_1h !== undefined &&
      endpoint.uptime_last_1h < PROVIDER_IMPACTED_UPTIME_THRESHOLD) ||
    (endpoint.latency_last_1h?.p50 !== undefined &&
      endpoint.latency_last_1h.p50 > PROVIDER_IMPACTED_P50_MS) ||
    (endpoint.latency_last_1h?.p95 !== undefined &&
      endpoint.latency_last_1h.p95 > PROVIDER_IMPACTED_P95_MS)
  );
}

export async function getModelAvailability(
  modelId: string,
  env: EnvLike = process.env
): Promise<ModelAvailability> {
  if (resolveModelRuntime(modelId, env) === "lmstudio") {
    const probe = await probeLmStudio();

    if (probe.status !== "healthy") {
      return "impacted";
    }

    if (
      allowedModelIds.has(modelId) ||
      probe.models.some((loaded) => loaded.id === modelId)
    ) {
      return "healthy";
    }

    return "unknown";
  }

  const activeModel = getActiveModels(env).find((item) => item.id === modelId);

  if (!activeModel) {
    return "unknown";
  }

  try {
    const res = await fetch(
      `https://ai-gateway.vercel.sh/v1/models/${activeModel.id}/endpoints`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) {
      return "unknown";
    }

    const json = await res.json();
    const endpoints = (json.data?.endpoints ?? []) as GatewayEndpoint[];

    if (endpoints.length === 0) {
      return "unknown";
    }

    return endpoints.some(isEndpointImpacted) ? "impacted" : "healthy";
  } catch {
    return "unknown";
  }
}
