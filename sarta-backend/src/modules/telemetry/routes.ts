import { db } from "@database/index.js";
import { redis } from "@database/redis.js";
import type { FastifyError } from "fastify";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { SensorNotFoundError } from "./domain/errors.js";
import { makeIdempotencyStore } from "./providers/idempotency-store.js";
import { makeTelemetryQueue } from "./providers/telemetry-queue.js";
import { makeTelemetryRepository } from "./providers/telemetry-repository.js";
import { postTelemetryAsyncSchema, postTelemetrySyncSchema } from "./schema.js";
import { makeIngestAsyncUseCase } from "./use-cases/ingest-async.js";
import { makeIngestSyncUseCase } from "./use-cases/ingest-sync.js";
import { makeTelemetryWorker } from "./workers/telemetry-worker.js";

export const telemetryRoutes: FastifyPluginAsyncZod = async (fastify, _opts) => {
	const telemetryRepository = makeTelemetryRepository(db);
	const idempotencyStore = makeIdempotencyStore(redis);
	const telemetryQueue = makeTelemetryQueue(redis);
	const telemetryWorker = makeTelemetryWorker(redis, telemetryRepository);

	const ingestSyncUseCase = makeIngestSyncUseCase(telemetryRepository, idempotencyStore);
	const ingestAsyncUseCase = makeIngestAsyncUseCase(telemetryRepository, idempotencyStore, telemetryQueue);
	fastify.post("/ingest/sync", postTelemetrySyncSchema, async (request, reply) => {
		const telemetryInput = request.body;
		const syncResponse = await ingestSyncUseCase.execute(telemetryInput, new Date());

		return reply.status(200).send(syncResponse);
	});

	fastify.post("/ingest/async", postTelemetryAsyncSchema, async (request, reply) => {
		const telemetryInput = request.body;
		const asyncResponse = await ingestAsyncUseCase.execute(telemetryInput, new Date());

		if (asyncResponse.enqueued) return reply.status(202).send(asyncResponse);
		return reply.status(200).send(asyncResponse);
	});

	fastify.setErrorHandler((error: FastifyError, _request, reply) => {
		if (error instanceof SensorNotFoundError) {
			return reply.status(422).send(error);
		}

		return reply.status(error.statusCode ?? 500).send(error);
	});

	fastify.addHook("onClose", async () => {
		await telemetryWorker.close();
	});
};
