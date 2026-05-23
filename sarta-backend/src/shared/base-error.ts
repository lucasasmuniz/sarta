export abstract class BaseError extends Error {
	abstract readonly statusCode: number;
	abstract readonly code: string;
	readonly timestamp: string;

	constructor(
		message: string,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);

		this.name = new.target.name;
		this.timestamp = new Date().toISOString();

		Object.setPrototypeOf(this, new.target.prototype);

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}
