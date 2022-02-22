import { GenericError } from './generic';
import { ERRORS } from '@core/constants/constants';
import { ErrorObject } from '@core/types/types';

export class RabbitMQError extends GenericError {
	constructor(code: string, message: string, description: string, resolution: string) {
		super(code, message, description, resolution);
	}
}

export class ConnectionFailed extends RabbitMQError {
	constructor(connection_string: string) {
		const error: ErrorObject = ERRORS.RabbitMQ.connection_failed;
		super(error.code(), error.message(), error.description(connection_string), error.resolution());
	}
}