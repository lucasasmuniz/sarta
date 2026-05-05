import { sql } from "drizzle-orm";
import { db } from "./index.js";
import { sensors, stations } from "./schema.js";

await db.transaction(async (tx) => {
	const newStations = await tx
		.insert(stations)
		.values([
			{
				name: "Estação 001",
				stationId: "STN-001",
				elevationM: 2,
				latitude: -8.684,
				longitude: -35.591,
				municipality: "Palmares",
			},
			{
				name: "Estação 002",
				stationId: "STN-002",
				elevationM: 1,
				latitude: -8.707,
				longitude: -35.532,
				municipality: "Catende",
			},
			{
				name: "Estação 003",
				stationId: "STN-003",
				elevationM: 2.4,
				latitude: -8.945,
				longitude: -35.289,
				municipality: "Barreiros",
			},
			{
				name: "Estação 004",
				stationId: "STN-004",
				elevationM: 1.3,
				latitude: -8.782,
				longitude: -35.973,
				municipality: "São Bento do Una",
			},
		])
		.onConflictDoUpdate({
			target: stations.stationId,
			set: {
				name: sql`excluded.name`,
				elevationM: sql`excluded.elevation_m`,
				latitude: sql`excluded.latitude`,
				longitude: sql`excluded.longitude`,
				municipality: sql`excluded.municipality`,
			},
		})
		.returning({ stationId: stations.stationId });

	for (const station of newStations) {
		const stationNumber = station.stationId.split("-")[1] || "000";
		await tx
			.insert(sensors)
			.values([
				{ sensorId: `SNS-${stationNumber}-RAIN`, stationId: station.stationId, sensorType: "RAIN", unit: "mm" },
				{ sensorId: `SNS-${stationNumber}-LEVEL`, stationId: station.stationId, sensorType: "LEVEL", unit: "m" },
				{
					sensorId: `SNS-${stationNumber}-TEMPERATURE`,
					stationId: station.stationId,
					sensorType: "TEMPERATURE",
					unit: "°C",
				},
				{
					sensorId: `SNS-${stationNumber}-PRESSURE`,
					stationId: station.stationId,
					sensorType: "PRESSURE",
					unit: "hPa",
				},
			])
			.onConflictDoUpdate({
				target: sensors.sensorId,
				set: { stationId: sql`excluded.station_id`, sensorType: sql`excluded.sensor_type`, unit: sql`excluded.unit` },
			});
	}
});
