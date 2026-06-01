import { sensors, telemetryReadings } from "@database/schema.js";
import { and, count, eq, gte } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { IngestionRoute, NewTelemetryReading, TelemetryReadingModel } from "../domain/types.js";

export const makeTelemetryRepository = (db: NodePgDatabase) => {
	return {
		insertReading: async (telemetryReading: NewTelemetryReading): Promise<boolean> => {
			const result = await db
				.insert(telemetryReadings)
				.values(telemetryReading)
				.onConflictDoNothing({ target: [telemetryReadings.sensorId, telemetryReadings.timestamp] })
				.returning();

			return result.length > 0;
		},
		findBySensor: async (sensorId: string, timestamp: Date | null): Promise<TelemetryReadingModel[]> => {
			const result = await db
				.select()
				.from(telemetryReadings)
				.where(
					and(
						eq(telemetryReadings.sensorId, sensorId),
						timestamp ? gte(telemetryReadings.timestamp, timestamp) : undefined,
					),
				);
			return result.map((row) => toDomain(row));
		},
		findByIngestionRoute: async (
			ingestionRoute: IngestionRoute,
			timestamp: Date | null,
		): Promise<TelemetryReadingModel[]> => {
			const result = await db
				.select()
				.from(telemetryReadings)
				.where(
					and(
						eq(telemetryReadings.ingestionRoute, ingestionRoute),
						timestamp ? gte(telemetryReadings.timestamp, timestamp) : undefined,
					),
				);
			return result.map((row) => toDomain(row));
		},
		//TODO: move to station module when its created
		sensorExists: async (sensorExternalId: string): Promise<boolean> => {
			const result = await db.select({ count: count() }).from(sensors).where(eq(sensors.sensorId, sensorExternalId));

			return (result[0]?.count ?? 0) > 0;
		},
	};
};

const toDomain = (row: typeof telemetryReadings.$inferSelect): TelemetryReadingModel => ({
	id: row.id,
	createdAt: row.createdAt,
	sensorId: row.sensorId,
	timestamp: row.timestamp,
	value: row.value,
	ingestionRoute: row.ingestionRoute,
	receivedAt: row.receivedAt,
});
