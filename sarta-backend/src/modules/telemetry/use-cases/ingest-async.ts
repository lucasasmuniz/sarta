import { SensorNotFoundError } from "../domain/errors.js";
import { computeIdempotencyKey } from "../domain/services/telemetry-service.js";
import type { NewTelemetryReading, TelemetryInput } from "../domain/types.js";
import type { IdempotencyStore, TelemetryQueue, TelemetryRepository } from "../providers/types.js";

type UseCaseResponse = { enqueued: true; jobId: string } | { enqueued: false; reason: string };

export const makeIngestAsyncUseCase = (
	telemetryRepository: TelemetryRepository,
	idempotencyStore: IdempotencyStore,
	telemetryQueue: TelemetryQueue,
) => {
	return {
		execute: async (telemetryInput: TelemetryInput, receivedAt: Date): Promise<UseCaseResponse> => {
			const sensorExists = await telemetryRepository.sensorExists(telemetryInput.sensorId);
			if (!sensorExists) throw new SensorNotFoundError(telemetryInput.sensorId);

			const idempotencyKey = computeIdempotencyKey(telemetryInput.sensorId, telemetryInput.timestamp);
			const isFirstSeen = await idempotencyStore.checkAndSet(idempotencyKey);
			if (!isFirstSeen) return { enqueued: false, reason: "duplicate" };

			const newTelemetryReading: NewTelemetryReading = {
				...telemetryInput,
				ingestionRoute: "ASYNC",
				receivedAt,
			};

			await telemetryQueue.queueReading(newTelemetryReading, idempotencyKey);
			return { enqueued: true, jobId: idempotencyKey };
		},
	};
};
