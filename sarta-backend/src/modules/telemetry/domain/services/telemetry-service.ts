import { SENSOR_TYPES, type SensorType } from "../types.js";

export const computeIdempotencyKey = (sensorId: string, timestamp: Date): string => {
	return `${sensorId}:${timestamp.toISOString()}`;
};

const MAX_TEMPERATURE_C = 60;
const MIN_TEMPERATURE_C = -50;
const MAX_PRESSURE_HPA = 1100;
const MIN_PRESSURE_HPA = 800;
const MIN_RAIN_MM = 0;
const MIN_LEVEL_M = 0;

export const validateSensorRange = (sensorType: SensorType, value: number | null): boolean => {
	if (value === null) return true;

	switch (sensorType) {
		case SENSOR_TYPES.TEMPERATURE:
			return value >= MIN_TEMPERATURE_C && value <= MAX_TEMPERATURE_C;
		case SENSOR_TYPES.RAIN:
			return value >= MIN_RAIN_MM;
		case SENSOR_TYPES.LEVEL:
			return value >= MIN_LEVEL_M;
		case SENSOR_TYPES.PRESSURE:
			return value >= MIN_PRESSURE_HPA && value <= MAX_PRESSURE_HPA;
		default:
			return false;
	}
};
