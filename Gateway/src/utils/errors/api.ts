import { ServerError } from '@service/utils/errors';
import { ERRORS } from '@service/utils/constants';
import { ServerErrorObject, UserRole } from '@service/utils/types';

export class APIError extends ServerError {
	constructor(code: string, status: number, message: string, description: string, resolution: string) {
		super(code, status, message, description, resolution);
	}
}

export class EndpointGenericError extends ServerError {
	constructor(endpoint: string) {
		const error: ServerErrorObject = ERRORS.API.endpoint_generic_error;
		super(error.code(), error.status(), error.message(), error.description(endpoint), error.resolution());
	}
}

export class UserNotFound extends APIError {
	constructor(username: string) {
		const error: ServerErrorObject = ERRORS.API.user_not_found;
		super(error.code(), error.status(), error.message(), error.description(username), error.resolution());
	}
}

export class UserManipulationError extends APIError {
	constructor(operation: string, username: string) {
		const error: ServerErrorObject = ERRORS.API.user_manipulation_error;
		super(error.code(), error.status(), error.message(), error.description(operation, username), error.resolution());
	}
}

export class PermissionDenied extends APIError {
	constructor(role: UserRole, expected: UserRole[]) {
		const error: ServerErrorObject = ERRORS.API.permission_denied;
		super(error.code(), error.status(), error.message(), error.description(role, expected), error.resolution());
	}
}

export class InitializationError extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.API.initialization_error;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class UnauthorizedInitialization extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.API.unauthorized_initialization;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}