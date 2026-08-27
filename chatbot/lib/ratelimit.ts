import { createClient } from "redis";

import { isProductionEnvironment } from "@/lib/constants";
import { ChatbotError } from "@/lib/errors";

// Controls the maximum number of chat requests allowed per IP within a one-hour window.
// Development allows a higher limit for testing, while production uses a lower limit
// to help prevent abuse and excessive API/model usage.
const RATE_LIMITS = {
  dev: {
    maxMessagesPerHour: 1000,
  },
  prod: {
    maxMessagesPerHour: 100,
  },
} as const;

const environment =
  process.env.APP_ENV === "prod" ? "prod" : "dev";

const MAX_MESSAGES =
  RATE_LIMITS[environment].maxMessagesPerHour;

const TTL_SECONDS = 60 * 60;


let client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!client && process.env.REDIS_URL) {
    client = createClient({ url: process.env.REDIS_URL });
    client.on("error", () => undefined);
    client.connect().catch(() => {
      client = null;
    });
  }
  return client;
}

export async function checkIpRateLimit(ip: string | undefined) {
  console.log(ip)
  if (!isProductionEnvironment || !ip) {
    return;
  }

  const redis = getClient();
  if (!redis?.isReady) {
    return;
  }

  try {
    const key = `ip-rate-limit:${ip}`;
    const [count] = await redis
      .multi()
      .incr(key)
      .expire(key, TTL_SECONDS, "NX")
      .exec();
    console.log("COUNT:", count)
    if (typeof count === "number" && count > MAX_MESSAGES) {
      throw new ChatbotError("rate_limit:chat");
    }
  } catch (error) {
    if (error instanceof ChatbotError) {
      throw error;
    }
  }
}
