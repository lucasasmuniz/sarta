import { ZodError } from "zod";

vi.mock("dotenv", async () => {
	return { default: { config: vi.fn() } };
});

const DATABASE_URL_MOCK = "postgres://example.com/database";
const REDIS_URL_MOCK = "redis://example.com/redis";
const API_BASE_URL_MOCK = "https://example.com/api";
const API_PORT_MOCK = "3000";

describe("When zod parses environment variables", () => {
	beforeEach(() => {
		vi.resetModules();

		vi.stubEnv("DATABASE_URL", DATABASE_URL_MOCK);
		vi.stubEnv("REDIS_URL", REDIS_URL_MOCK);
		vi.stubEnv("API_BASE_URL", API_BASE_URL_MOCK);
		vi.stubEnv("API_PORT", API_PORT_MOCK);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("should have all values defined", async () => {
		const envValues = (await import("../env.js")).env;

		expect(envValues).toBeDefined();

		expect(envValues.DATABASE_URL).toBe(DATABASE_URL_MOCK);
		expect(envValues.REDIS_URL).toBe(REDIS_URL_MOCK);
		expect(envValues.API_BASE_URL).toBe(API_BASE_URL_MOCK);
		expect(envValues.API_PORT).toBe(Number(API_PORT_MOCK));
	});

	it("should throw ZodError when values are missing", async () => {
		vi.stubEnv("DATABASE_URL", undefined);

		await expect(import("../env.js")).rejects.toThrow(ZodError);
	});

	it("should throw ZodError for invalid URL values", async () => {
		vi.stubEnv("DATABASE_URL", "not-a-url");

		await expect(import("../env.js")).rejects.toThrow(ZodError);
	});

	it("should throw ZodError for invalid number values", async () => {
		vi.stubEnv("API_PORT", "not-a-number");

		await expect(import("../env.js")).rejects.toThrow(ZodError);
	});

	it("should throw ZodError for invalid DATABASE_URL protocol", async () => {
		vi.stubEnv("DATABASE_URL", "http://example.com/database");

		await expect(import("../env.js")).rejects.toThrow(ZodError);
	});

	it("should throw ZodError for invalid REDIS_URL protocol", async () => {
		vi.stubEnv("REDIS_URL", "http://example.com/redis");

		await expect(import("../env.js")).rejects.toThrow(ZodError);
	});
});
