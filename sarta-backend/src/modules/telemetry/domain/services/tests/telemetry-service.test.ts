import { SENSOR_TYPES } from "../../types.js";
import { computeIdempotencyKey, validateSensorRange } from "../telemetry-service.js";

describe("TelemetryService", () => {
	describe("computeIdempotencyKey", () => {
		it("should compute the correct idempotency key", () => {
			const sensorId = "sensor123";
			const timestamp = new Date("2024-01-01T00:00:00Z");
			const expectedKey = "sensor123_2024-01-01T00:00:00.000Z";

			const result = computeIdempotencyKey(sensorId, timestamp);
			expect(result).toBe(expectedKey);
		});

		it("should produce different keys for different timestamps", () => {
			const sensorId = "sensor123";
			const timestamp1 = new Date("2024-01-01T00:00:00Z");
			const timestamp2 = new Date("2024-01-01T00:01:00Z");

			const key1 = computeIdempotencyKey(sensorId, timestamp1);
			const key2 = computeIdempotencyKey(sensorId, timestamp2);

			expect(key1).not.toBe(key2);
		});

		it("should produce different keys for different sensor IDs", () => {
			const timestamp = new Date("2024-01-01T00:00:00Z");
			const sensorId1 = "sensor123";
			const sensorId2 = "sensor456";

			const key1 = computeIdempotencyKey(sensorId1, timestamp);
			const key2 = computeIdempotencyKey(sensorId2, timestamp);

			expect(key1).not.toBe(key2);
		});

		it("should produce the same key for the same sensor ID and timestamp", () => {
			const sensorId = "sensor123";
			const timestamp = new Date("2024-01-01T00:00:00Z");

			const key1 = computeIdempotencyKey(sensorId, timestamp);
			const key2 = computeIdempotencyKey(sensorId, timestamp);

			expect(key1).toBe(key2);
		});
	});

	describe("validateSensorRange", () => {
		describe("Temperature Sensor", () => {
			it("should return true for valid temperature", () => {
				expect(validateSensorRange(SENSOR_TYPES.TEMPERATURE, 25)).toBe(true);
			});

			it("should return false for higher than limit temperature", () => {
				expect(validateSensorRange(SENSOR_TYPES.TEMPERATURE, 70)).toBe(false);
			});

			it("should return false for lower than limit temperature", () => {
				expect(validateSensorRange(SENSOR_TYPES.TEMPERATURE, -60)).toBe(false);
			});

			it("should return true for boundary temperature values", () => {
				expect(validateSensorRange(SENSOR_TYPES.TEMPERATURE, 60)).toBe(true);
				expect(validateSensorRange(SENSOR_TYPES.TEMPERATURE, -50)).toBe(true);
			});

			it("should return true for null value", () => {
				expect(validateSensorRange(SENSOR_TYPES.TEMPERATURE, null)).toBe(true);
			});
		});

		describe("Pressure Sensor", () => {
			it("should return true for valid pressure", () => {
				expect(validateSensorRange(SENSOR_TYPES.PRESSURE, 1000)).toBe(true);
			});

			it("should return false for higher than limit pressure", () => {
				expect(validateSensorRange(SENSOR_TYPES.PRESSURE, 1200)).toBe(false);
			});

			it("should return false for lower than limit pressure", () => {
				expect(validateSensorRange(SENSOR_TYPES.PRESSURE, 700)).toBe(false);
			});

			it("should return true for boundary pressure values", () => {
				expect(validateSensorRange(SENSOR_TYPES.PRESSURE, 1100)).toBe(true);
				expect(validateSensorRange(SENSOR_TYPES.PRESSURE, 800)).toBe(true);
			});

			it("should return true for null value", () => {
				expect(validateSensorRange(SENSOR_TYPES.PRESSURE, null)).toBe(true);
			});
		});

		describe("Rain Sensor", () => {
			it("should return true for valid rain", () => {
				expect(validateSensorRange(SENSOR_TYPES.RAIN, 10)).toBe(true);
			});

			it("should return false for lower than limit rain", () => {
				expect(validateSensorRange(SENSOR_TYPES.RAIN, -5)).toBe(false);
			});

			it("should return true for boundary rain value", () => {
				expect(validateSensorRange(SENSOR_TYPES.RAIN, 0)).toBe(true);
			});

			it("should return true for null value", () => {
				expect(validateSensorRange(SENSOR_TYPES.RAIN, null)).toBe(true);
			});
		});

		describe("Level Sensor", () => {
			it("should return true for valid level", () => {
				expect(validateSensorRange(SENSOR_TYPES.LEVEL, 5)).toBe(true);
			});

			it("should return false for lower than limit level", () => {
				expect(validateSensorRange(SENSOR_TYPES.LEVEL, -1)).toBe(false);
			});

			it("should return true for boundary level value", () => {
				expect(validateSensorRange(SENSOR_TYPES.LEVEL, 0)).toBe(true);
			});

			it("should return true for null value", () => {
				expect(validateSensorRange(SENSOR_TYPES.LEVEL, null)).toBe(true);
			});
		});
	});
});
