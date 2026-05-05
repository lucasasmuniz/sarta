import type { Redis } from "ioredis";

export const makeIdempotencyStore = (redis: Redis) => {
	return {
		checkAndSet: async (key: string, ttlSeconds: number) => {
			const result = await redis.set(key, "value", "EX", ttlSeconds, "NX");
			return result === "OK";
		},
	};
};
