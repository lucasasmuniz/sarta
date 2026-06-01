import type { NewTelemetryReading } from "../domain/types.js";

export type TelemetryReadingJobData = Omit<NewTelemetryReading, "receivedAt" | "timestamp"> & {
	receivedAt: string;
	timestamp: string;
};

export const toJobData = (reading: NewTelemetryReading): TelemetryReadingJobData => {
	return {
		sensorId: reading.sensorId,
		value: reading.value,
		ingestionRoute: reading.ingestionRoute,
		receivedAt: reading.receivedAt.toISOString(),
		timestamp: reading.timestamp.toISOString(),
	};
};

export const fromJobData = (data: TelemetryReadingJobData): NewTelemetryReading => {
	return {
		sensorId: data.sensorId,
		value: data.value,
		ingestionRoute: data.ingestionRoute,
		receivedAt: new Date(data.receivedAt),
		timestamp: new Date(data.timestamp),
	};
};
