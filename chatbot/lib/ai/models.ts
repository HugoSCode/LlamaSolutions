export const DEFAULT_CHAT_MODEL = "openai/gpt-5-nano-2025-08-07";

export const titleModel = {
  description: "Fast model for title generation",
  id: "openai/gpt-5-nano-2025-08-07",
  name: "GPT-5 Nano",
  provider: "openai",
};

export const moderationModel = {
  description: "OpenAI moderation model for pre-screening user input",
  id: "omni-moderation-latest",
  name: "OpenAI Moderation",
  provider: "openai",
};

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

export const chatModels: ChatModel[] = [
  {
    description: "OpenAI GPT-5 Nano with built-in tool use and fast responses",
    id: "openai/gpt-5-nano-2025-08-07",
    name: "GPT-5 Nano",
    provider: "openai",
  },
  {
    description: "OpenAI's flagship model with vision, reasoning, and tool use",
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "openai",
  },
];

export const isDemo = process.env.IS_DEMO === "5";

export type GatewayModelWithCapabilities = ChatModel & {
  capabilities: ModelCapabilities;
};

export function getActiveModels(): ChatModel[] {
  return chatModels;
}

export const allowedModelIds = new Set(
  chatModels.map((model) => model.id)
);

export const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }

    acc[model.provider].push(model);

    return acc;
  },
  {} as Record<string, ChatModel[]>
);

export async function getCapabilities(): Promise<
  Record<string, ModelCapabilities>
> {
  return {
    "openai/gpt-5-nano-2025-08-07": {
      tools: true,
      vision: true,
      reasoning: true,
    },
    "openai/gpt-4o": {
      tools: true,
      vision: true,
      reasoning: true,
    },
  };
}

export type ModelAvailability = "healthy" | "impacted" | "unknown";

export async function getModelAvailability(
  modelId: string
): Promise<ModelAvailability> {
  if (!allowedModelIds.has(modelId)) {
    return "unknown";
  }

  // Models are routed through Vercel AI Gateway, which handles
  // provider availability itself.
  return "healthy";
}