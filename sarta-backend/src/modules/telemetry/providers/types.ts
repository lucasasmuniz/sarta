import type { makeIdempotencyStore } from "./idempotency-store.js";
import type { makeTelemetryQueue } from "./telemetry-queue.js";
import type { makeTelemetryRepository } from "./telemetry-repository.js";

export type TelemetryRepository = ReturnType<typeof makeTelemetryRepository>;

export type IdempotencyStore = ReturnType<typeof makeIdempotencyStore>;

export type TelemetryQueue = ReturnType<typeof makeTelemetryQueue>;
