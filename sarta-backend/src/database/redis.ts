import { env } from "@shared/env.js";
import { Redis } from "ioredis";

export const redis = new Redis(env.REDIS_URL);
