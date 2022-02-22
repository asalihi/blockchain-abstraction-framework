import { GenericError } from './generic';
import { ERRORS } from '@core/constants/constants';
import { ErrorObject } from '@core/types/types';

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

export class ShellInstructionExecutionError {
	private instruction: string;
	private code: number;

	constructor(instruction: string, code: number) {
		this.instruction = instruction;
		this.code = code;
	}

	public info(): { 'instruction': string, 'code': number } {
		return { 'instruction': this.instruction, 'code': this.code };
	}
}

export class ShellCommandExecutionError extends ShellInstructionExecutionError {
	private type: string = 'command';

	constructor(error: { 'instruction': string, 'code': number }) {
		super(error['instruction'], error['code']);
	}

	public info(): { 'instruction': string, 'code': number } {
		return Object.assign({ type: this.type }, super.info());
	}
}

export class ShellScriptExecutionError extends ShellInstructionExecutionError {
	private type: string = 'script';

	constructor(error: { 'instruction': string, 'code': number }) {
		super(error['instruction'], error['code']);
	}

	public info(): { 'instruction': string, 'code': number } {
		return Object.assign({ type: this.type }, super.info());
	}
}