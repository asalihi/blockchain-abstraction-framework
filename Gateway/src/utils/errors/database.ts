import { GenericError } from '@service/utils/errors';
import { ERRORS } from '@service/utils/constants/errors';
import { ErrorObject } from '@service/utils/types';

export class DatabaseError extends GenericError {
	constructor(code: string, message: string, description: string, resolution: string) {
		super(code, message, description, resolution);
	}
}

export class ElementNotFoundInCollection extends DatabaseError {
	constructor(element: string, identifier: string) {
		const error: ErrorObject = ERRORS.Database.element_not_found;
		super(error.code(), error.message(element), error.description(element, identifier), error.resolution(element));
	}
}

export class QueryExecutionError extends DatabaseError {
	constructor(type: string) {
		const error: ErrorObject = ERRORS.Database.query_execution_error;
		super(error.code(), error.message(), error.description(type), error.resolution());
	}
}