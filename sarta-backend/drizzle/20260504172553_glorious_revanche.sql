CREATE TYPE "public"."ingestion_route_enum" AS ENUM('SYNC', 'ASYNC');--> statement-breakpoint
CREATE TYPE "public"."sensor_type_enum" AS ENUM('RAIN', 'LEVEL', 'TEMPERATURE', 'PRESSURE');--> statement-breakpoint
CREATE TABLE "sensors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sensors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sensor_id" varchar(256) NOT NULL,
	"station_id" varchar(256) NOT NULL,
	"sensor_type" "sensor_type_enum" NOT NULL,
	"unit" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sensors_sensorId_unique" UNIQUE("sensor_id")
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"station_id" varchar(256) NOT NULL,
	"name" text NOT NULL,
	"municipality" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"elevation_m" real NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stations_stationId_unique" UNIQUE("station_id")
);
--> statement-breakpoint
CREATE TABLE "telemetry_readings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "telemetry_readings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sensor_id" varchar(256) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"ingestion_route" "ingestion_route_enum" NOT NULL,
	"value" real,
	"received_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telemetry_readings_sensorId_timestamp_unique" UNIQUE("sensor_id","timestamp")
);
--> statement-breakpoint
ALTER TABLE "sensors" ADD CONSTRAINT "sensors_station_id_stations_station_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("station_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telemetry_readings" ADD CONSTRAINT "telemetry_readings_sensor_id_sensors_sensor_id_fk" FOREIGN KEY ("sensor_id") REFERENCES "public"."sensors"("sensor_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "telemetry_readings_timestamp_index" ON "telemetry_readings" USING btree ("timestamp");