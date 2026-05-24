import { type Job, Worker } from "bullmq";
import type { Redis } from "ioredis";
import type { NewTelemetryReading } from "../domain/types.js";
import { QUEUE_NAME } from "../providers/telemetry-queue.js";
import type { TelemetryRepository } from "../providers/types.js";

export const makeTelemetryWorker = (redis: Redis, telemetryRepository: TelemetryRepository) => {
	const worker = new Worker<NewTelemetryReading, { duplicate: boolean }>(
		QUEUE_NAME,
		async (job: Job) => {
			const telemetryReading = job.data;

			const inserted = await telemetryRepository.insertReading(telemetryReading);
			if (!inserted) return { duplicate: true };

			return { duplicate: false };
		},
		{ connection: redis, concurrency: 1 },
	);
	return {
		close: async () => {
			await worker.close();
		},
	};
};
