import { relations } from "drizzle-orm";
import * as t from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const stations = pgTable("stations", {
	id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
	stationId: t.varchar({ length: 256 }).unique().notNull(),
	name: t.text().notNull(),
	municipality: t.text().notNull(),
	latitude: t.real().notNull(),
	longitude: t.real().notNull(),
	elevationM: t.real().notNull(),
	createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const stationRelations = relations(stations, ({ many }) => ({
	sensors: many(sensors),
}));

export const sensorTypeEnum = t.pgEnum("sensor_type_enum", ["RAIN", "LEVEL", "TEMPERATURE", "PRESSURE"]);

export const sensors = pgTable("sensors", {
	id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
	sensorId: t.varchar({ length: 256 }).unique().notNull(),
	stationId: t
		.varchar({ length: 256 })
		.references(() => stations.stationId, { onDelete: "cascade" })
		.notNull(),
	sensorType: sensorTypeEnum("sensor_type").notNull(),
	unit: t.varchar().notNull(),
	createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sensorRelations = relations(sensors, ({ one, many }) => ({
	station: one(stations, {
		fields: [sensors.stationId],
		references: [stations.stationId],
	}),
	telemetryReadings: many(telemetryReadings),
}));

export const ingestionRouteEnum = t.pgEnum("ingestion_route_enum", ["SYNC", "ASYNC"]);

export const telemetryReadings = pgTable(
	"telemetry_readings",
	{
		id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
		sensorId: t
			.varchar({ length: 256 })
			.references(() => sensors.sensorId, { onDelete: "restrict" })
			.notNull(),
		timestamp: t.timestamp({ withTimezone: true }).notNull(),
		ingestionRoute: ingestionRouteEnum("ingestion_route").notNull(),
		value: t.real(),
		receivedAt: t.timestamp({ withTimezone: true }).notNull(),
		createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [t.unique().on(table.sensorId, table.timestamp), t.index().on(table.timestamp)],
);

export const telemetryReadingsRelations = relations(telemetryReadings, ({ one }) => ({
	sensor: one(sensors, {
		fields: [telemetryReadings.sensorId],
		references: [sensors.sensorId],
	}),
}));
