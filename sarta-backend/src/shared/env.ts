import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
	DATABASE_URL: z.url("DATABASE_URL must be a valid URL")
	.regex(
      /^postgres(?:ql)?:\/\//, 
      "invalid DATABASE_URL. Protocol must be 'postgres://' or 'postgresql://'"
    ),
	REDIS_URL: z.url("REDIS_URL must be a valid URL")
	.regex(
      /^rediss?:\/\//, 
      "invalid REDIS_URL. Protocol must be 'redis://' or 'rediss://'"
    ),
	API_BASE_URL: z.url("API_BASE_URL must be a valid URL"),
	API_PORT: z.coerce.number("API_PORT must be a number").default(3000),
});

export const env = envSchema.parse(process.env);
