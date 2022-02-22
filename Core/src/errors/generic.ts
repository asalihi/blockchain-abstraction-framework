export class GenericError extends Error {
	public code: string;
	public description: string;
	public resolution: string;

	constructor(code: string, message: string, description: string, resolution: string) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
		this.description = description;
		this.resolution = resolution;
		Error.captureStackTrace(this, GenericError);
	}

	public json(): Object {
		return { code: this.code, message: this.message, description: this.description, resolution: this.resolution };
	}
}