import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerHour: number;
};

//Grabs the environment type (dev/prod) from env and decides how many messages each user gets
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

export const entitlementsByUserType = {
  guest: {
    maxMessagesPerHour:
      RATE_LIMITS[environment].maxMessagesPerHour,
  },
  regular: {
    maxMessagesPerHour:
      RATE_LIMITS[environment].maxMessagesPerHour,
  },
};

