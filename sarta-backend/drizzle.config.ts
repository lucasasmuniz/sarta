import { defineConfig } from "drizzle-kit";
import { env } from "./src/shared/env.js";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/database/schema.ts",
	out: "./drizzle",
	casing: "snake_case",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	migrations: {
		prefix: "timestamp",
		table: "__drizzle_migrations__",
		schema: "public",
	},
});
