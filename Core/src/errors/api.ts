import { ServerError } from './server';

export class APIError extends ServerError {
	constructor(code: string, status: number, message: string, description: string, resolution: string) {
		super(code, status, message, description, resolution);
	}
}