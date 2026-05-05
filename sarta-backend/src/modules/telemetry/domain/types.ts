export const SENSOR_TYPES = {
	TEMPERATURE: "TEMPERATURE",
	RAIN: "RAIN",
	LEVEL: "LEVEL",
	PRESSURE: "PRESSURE",
} as const;

export type SensorType = (typeof SENSOR_TYPES)[keyof typeof SENSOR_TYPES];

export const INGESTION_ROUTES = {
	ASYNC: "ASYNC",
	SYNC: "SYNC",
} as const;

export type IngestionRoute = (typeof INGESTION_ROUTES)[keyof typeof INGESTION_ROUTES];

export type TelemetryInput = Readonly<{
	sensorId: string;
	timestamp: Date;
	value: number | null;
}>;

export type NewTelemetryReading = TelemetryInput &
	Readonly<{
		ingestionRoute: IngestionRoute;
		receivedAt: Date;
	}>;

export type TelemetryReadingModel = Readonly<{
	id: number;
	createdAt: Date;
}> &
	NewTelemetryReading;
