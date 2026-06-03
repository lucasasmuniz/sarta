import { SENSOR_TYPES, type SensorType } from "@modules/telemetry/domain/types.js";
import { sql } from "drizzle-orm";
import { db } from "./index.js";
import { sensors, stations } from "./schema.js";

const sensorUnitRecord: Record<SensorType, string> = {
	RAIN: "mm",
	LEVEL: "m",
	TEMPERATURE: "°C",
	PRESSURE: "hPa",
};

await db.transaction(async (tx) => {
	for (let i = 0; i < 500; i++) {
		const stationNumber = String(i + 1).padStart(3, "0");
		const stationId = `STN-${stationNumber}`;

		await tx
			.insert(stations)
			.values({
				name: `Estação ${stationNumber}`,
				stationId,
				elevationM: 1 + i * 0.1,
				latitude: -8.0 + i ** 0.25,
				longitude: -35.0 + i ** 0.5,
				municipality: `Municipio ${stationNumber}`,
			})
			.onConflictDoUpdate({
				target: stations.stationId,
				set: {
					name: sql`excluded.name`,
					elevationM: sql`excluded.elevation_m`,
					latitude: sql`excluded.latitude`,
					longitude: sql`excluded.longitude`,
					municipality: sql`excluded.municipality`,
				},
			});

		await tx
			.insert(sensors)
			.values([
				{
					sensorId: `SNS-${stationNumber}-${SENSOR_TYPES.RAIN}`,
					stationId,
					sensorType: SENSOR_TYPES.RAIN,
					unit: sensorUnitRecord[SENSOR_TYPES.RAIN],
				},
				{
					sensorId: `SNS-${stationNumber}-${SENSOR_TYPES.LEVEL}`,
					stationId,
					sensorType: SENSOR_TYPES.LEVEL,
					unit: sensorUnitRecord[SENSOR_TYPES.LEVEL],
				},
				{
					sensorId: `SNS-${stationNumber}-${SENSOR_TYPES.TEMPERATURE}`,
					stationId,
					sensorType: SENSOR_TYPES.TEMPERATURE,
					unit: sensorUnitRecord[SENSOR_TYPES.TEMPERATURE],
				},
				{
					sensorId: `SNS-${stationNumber}-${SENSOR_TYPES.PRESSURE}`,
					stationId,
					sensorType: SENSOR_TYPES.PRESSURE,
					unit: sensorUnitRecord[SENSOR_TYPES.PRESSURE],
				},
			])
			.onConflictDoUpdate({
				target: sensors.sensorId,
				set: { stationId: sql`excluded.station_id`, sensorType: sql`excluded.sensor_type`, unit: sql`excluded.unit` },
			});
	}
});
