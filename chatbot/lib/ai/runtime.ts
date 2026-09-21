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

/** True only on Vercel-hosted deploys. School LM Studio is unreachable from there. */
export function isOnVercel(env: EnvLike = process.env): boolean {
  return Boolean(env.VERCEL);
}

/** Local `pnpm dev` (and other non-Vercel hosts) can talk to LM Studio. */
export function canUseLmStudio(env: EnvLike = process.env): boolean {
  return !isOnVercel(env);
}

/** Gateway credentials exist (Vercel OIDC, a key, or a Vercel deploy). */
export function isAiGatewayEnabled(env: EnvLike = process.env): boolean {
  return Boolean(
    env.VERCEL ||
      env.VERCEL_OIDC_TOKEN ||
      hasAiGatewayApiKey(env.AI_GATEWAY_API_KEY)
  );
}

/** Default backend when no model id is selected. Not an exclusive lock. */
export function getAiRuntime(env: EnvLike = process.env): AiRuntime {
  return isAiGatewayEnabled(env) ? "gateway" : "lmstudio";
}
