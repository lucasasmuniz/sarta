import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.url('DATABASE_URL must be a valid URL'),
    REDIS_URL: z.url('REDIS_URL must be a valid URL'),
    API_BASE_URL: z.url('API_BASE_URL must be a valid URL'),
    API_PORT: z.coerce.number('API_PORT must be a number').default(3000),
});

export const env = envSchema.parse(process.env);