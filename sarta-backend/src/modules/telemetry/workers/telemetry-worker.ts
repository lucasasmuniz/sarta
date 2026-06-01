import { Worker } from "bullmq";
import type { FastifyBaseLogger } from "fastify";
import type { Redis } from "ioredis";
import { fromJobData, type TelemetryReadingJobData } from "../providers/telemetry-job-codec.js";
import { QUEUE_NAME } from "../providers/telemetry-queue.js";
import type { TelemetryRepository } from "../providers/types.js";

export const makeTelemetryWorker = (
	redis: Redis,
	telemetryRepository: TelemetryRepository,
	logger: FastifyBaseLogger,
) => {
	const worker = new Worker<TelemetryReadingJobData, { duplicate: boolean }>(
		QUEUE_NAME,
		async (job) => {
			const telemetryReading = fromJobData(job.data);

			const inserted = await telemetryRepository.insertReading(telemetryReading);
			if (!inserted) return { duplicate: true };

			return { duplicate: false };
		},
		{ connection: redis, concurrency: 1 },
	);

	worker.on("failed", (job, err) => {
		logger.error({ jobId: job?.id, err }, "Job failed");
	});

	worker.on("error", (err) => {
		logger.error({ err }, "Worker error");
	});
	return {
		close: async () => {
			await worker.close();
		},
	};
};
