import { GenericError } from '@service/utils/errors';
import { ERRORS } from '@service/utils/constants';
import { ErrorObject } from '@service/utils/types';

// TODO: Check if all classes are used

export class UtilityError extends GenericError {
	constructor(code: string, message: string, description: string, resolution: string) {
		super(code, message, description, resolution);
	}
}

export class ReadFileError extends UtilityError {
	constructor(file: string) {
		const error: ErrorObject = ERRORS.Utility.read_file_error;
		super(error.code(), error.message(), error.description(file), error.resolution());
	}
}

export class WriteFileError extends UtilityError {
	constructor(file: string) {
		const error: ErrorObject = ERRORS.Utility.write_file_error;
		super(error.code(), error.message(), error.description(file), error.resolution());
	}
}

export class DirectoryCreationError extends UtilityError {
	constructor(directory: string) {
		const error: ErrorObject = ERRORS.Utility.directory_creation_error;
		super(error.code(), error.message(), error.description(directory), error.resolution());
	}
}

export class InvalidDuration extends UtilityError {
	constructor(duration: string) {
		const error: ErrorObject = ERRORS.Utility.invalid_duration;
		super(error.code(), error.message(), error.description(duration), error.resolution());
	}
}

export class ConversionError extends UtilityError {
	constructor(what: string, type: string) {
		const error: ErrorObject = ERRORS.Utility.conversion_error;
		super(error.code(), error.message(type), error.description(what, type), error.resolution());
	}
}

export class DateManipulationError extends UtilityError {
	constructor(manipulation: string) {
		const error: ErrorObject = ERRORS.Utility.date_manipulation_error;
		super(error.code(), error.message(), error.description(manipulation), error.resolution());
	}
}