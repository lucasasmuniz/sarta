import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import type { NewTelemetryReading } from "../domain/types.js";

export const QUEUE_NAME = "telemetry-ingestion";

export const makeTelemetryQueue = (redis: Redis) => {
	const queue = new Queue(QUEUE_NAME, { connection: redis });
	return {
		queueClose: () => queue.close(),
		queueReading: (telemetryReading: NewTelemetryReading, jobId: string) => {
			return queue.add("ingest", telemetryReading, {
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
