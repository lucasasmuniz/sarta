import { BaseError } from "@shared/base-error.js";

export class SensorNotFoundError extends BaseError {
	override readonly code: string = "SENSOR_NOT_FOUND";
	override readonly statusCode: number = 422;

	constructor(sensorExternalId: string) {
		super(`Sensor not found: ${sensorExternalId}`);
	}
}
