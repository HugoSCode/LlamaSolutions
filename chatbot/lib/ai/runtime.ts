export type AiRuntime = "gateway" | "lmstudio";

const PLACEHOLDER_KEYS = new Set(["", "****"]);

type EnvLike = Record<string, string | undefined>;

export function hasAiGatewayApiKey(
  apiKey: string | null | undefined = process.env.AI_GATEWAY_API_KEY
): boolean {
  const trimmed = apiKey?.trim();
  if (!trimmed || PLACEHOLDER_KEYS.has(trimmed)) {
    return false;
  }
  return true;
}

export function isAiGatewayEnabled(env: EnvLike = process.env): boolean {
  return Boolean(
    env.VERCEL ||
      env.VERCEL_OIDC_TOKEN ||
      hasAiGatewayApiKey(env.AI_GATEWAY_API_KEY)
  );
}

export function getAiRuntime(env: EnvLike = process.env): AiRuntime {
  return isAiGatewayEnabled(env) ? "gateway" : "lmstudio";
}
