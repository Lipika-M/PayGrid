import { redis } from "../config/redis.js";

const PREFIX = "idempotency";

const TTL_SECONDS = 60 * 60 * 24; // 24 hours

export const checkIdempotency = async (key) => {
  const value = await redis.get(`${PREFIX}:${key}`);
  return value;
};

export const saveIdempotency = async ({ key, transactionId }) => {
  await redis.set(
    `${PREFIX}:${key}`,
    transactionId,
    "EX",
    TTL_SECONDS
  );
};
