import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import type { NewTelemetryReading } from "../domain/types.js";
import { type TelemetryReadingJobData, toJobData } from "./telemetry-job-codec.js";

export const QUEUE_NAME = "telemetry-ingestion";

export const makeTelemetryQueue = (redis: Redis) => {
	const queue = new Queue<TelemetryReadingJobData>(QUEUE_NAME, { connection: redis });
	return {
		queueClose: () => queue.close(),
		queueReading: (telemetryReading: NewTelemetryReading, jobId: string) => {
			return queue.add("ingest", toJobData(telemetryReading), {
				jobId,
				removeOnComplete: {
					age: 86400,
				},
				attempts: 3,
				backoff: {
					type: "exponential",
					delay: 1000,
				},
			});
		},
	};
};
