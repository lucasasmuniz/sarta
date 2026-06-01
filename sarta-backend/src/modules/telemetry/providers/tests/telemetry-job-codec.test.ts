import type { NewTelemetryReading } from "@modules/telemetry/domain/types.js";
import { fromJobData, toJobData } from "../telemetry-job-codec.js";

describe("Telemetry Job Codec", () => {
	const telemetryReading: NewTelemetryReading = {
		sensorId: "sensor-123",
		value: 42,
		ingestionRoute: "ASYNC",
		receivedAt: new Date("2024-01-01T12:00:00Z"),
		timestamp: new Date("2024-01-01T11:59:00Z"),
	};

	describe("round-trip conversion", () => {
		it("should convert NewTelemetryReading to TelemetryReadingJobData and back correctly", () => {
			expect(fromJobData(toJobData(telemetryReading))).toEqual(telemetryReading);
		});

		it("should accept null values for optional fields", () => {
			const readingWithNulls: NewTelemetryReading = {
				...telemetryReading,
				value: null,
			};
			const jobData = toJobData(readingWithNulls);
			expect(jobData.value).toBeNull();

			const convertedBack = fromJobData(jobData);
			expect(convertedBack.value).toBeNull();
		});
	});

	describe("toJobData", () => {
		it("should produce a JSON-safe object", () => {
			const jobData = toJobData(telemetryReading);
			const jsonParsed = JSON.parse(JSON.stringify(jobData));
			expect(jsonParsed).toEqual(jobData);
		});

		it("should convert dates to ISO strings", () => {
			const jobData = toJobData(telemetryReading);
			expect(jobData.receivedAt).toBe(telemetryReading.receivedAt.toISOString());
			expect(jobData.timestamp).toBe(telemetryReading.timestamp.toISOString());
		});
	});

	describe("fromJobData", () => {
		it("should convert ISO strings back to Date objects", () => {
			const jobData = toJobData(telemetryReading);
			const convertedBack = fromJobData(jobData);
			expect(convertedBack.receivedAt).toBeInstanceOf(Date);
			expect(convertedBack.timestamp).toBeInstanceOf(Date);
			expect(convertedBack.receivedAt.toISOString()).toBe(jobData.receivedAt);
			expect(convertedBack.timestamp.toISOString()).toBe(jobData.timestamp);
		});
	});
});
