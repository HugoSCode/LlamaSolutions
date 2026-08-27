export const DEFAULT_CHAT_MODEL = "qwen/qwen3-vl-4b";
 
export const titleModel = {
  description: "Fast local model for title generation",
  id: "qwen/qwen3-vl-4b",
  name: "Qwen3 VL 4B",
  provider: "lmstudio",
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
    description: "Local Qwen3 VL 4B model with vision and tool use",
    id: "qwen/qwen3-vl-4b",
    name: "Qwen3 VL 4B",
    provider: "lmstudio",
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
    "qwen/qwen3-vl-4b": {
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
 
  // LM Studio is local, so there is no Vercel Gateway
  // endpoint to query for availability.
  return "healthy";
}