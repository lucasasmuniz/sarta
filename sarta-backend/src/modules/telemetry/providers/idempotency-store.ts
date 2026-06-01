import type { Redis } from "ioredis";

const TTL_SECONDS = 86400;

export const makeIdempotencyStore = (redis: Redis) => {
	return {
		checkAndSet: async (key: string) => {
			const result = await redis.set(key, "value", "EX", TTL_SECONDS, "NX");
			return result === "OK";
		},
		deleteKey: async (key: string) => {
			await redis.del(key);
		},
	};
};
