import { SensorNotFoundError } from "../domain/errors.js";
import { computeIdempotencyKey } from "../domain/services/telemetry-service.js";
import type { NewTelemetryReading, TelemetryInput } from "../domain/types.js";
import type { IdempotencyStore, TelemetryRepository } from "../providers/types.js";

export const makeIngestSyncUseCase = (telemetryRepository: TelemetryRepository, idempotencyStore: IdempotencyStore) => {
	return {
		execute: async (telemetryInput: TelemetryInput, receivedAt: Date): Promise<{ duplicate: boolean }> => {
			const sensorExists = await telemetryRepository.sensorExists(telemetryInput.sensorId);
			if (!sensorExists) throw new SensorNotFoundError(telemetryInput.sensorId);

			const idempotencyKey = computeIdempotencyKey(telemetryInput.sensorId, telemetryInput.timestamp);
			const isFirstSeen = await idempotencyStore.checkAndSet(idempotencyKey);
			if (!isFirstSeen) return { duplicate: true };

			const newTelemetryReading: NewTelemetryReading = {
				...telemetryInput,
				ingestionRoute: "SYNC",
				receivedAt,
			};

			const inserted = await telemetryRepository.insertReading(newTelemetryReading);
			if (!inserted) return { duplicate: true };

			return { duplicate: false };
		},
	};
};
