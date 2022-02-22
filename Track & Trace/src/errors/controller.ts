import { ErrorObject, ControllerError } from 'core';
import { ERRORS } from '@service/constants/errors';

export class InvalidProcessSignature extends ControllerError {
	constructor(process: string) {
		let error: ErrorObject = ERRORS.Controller.invalid_process_signature;
		super(error.code(), error.message(), error.description(process), error.resolution());
	}
}

export class InvalidProcessVersionSignature extends ControllerError {
	constructor(process: string, version: string) {
		let error: ErrorObject = ERRORS.Controller.invalid_process_version_signature;
		super(error.code(), error.message(), error.description(process, version), error.resolution());
	}
}

export class InvalidExecutionInstanceSignature extends ControllerError {
	constructor(instance: string) {
		let error: ErrorObject = ERRORS.Controller.invalid_execution_instance_signature;
		super(error.code(), error.message(), error.description(instance), error.resolution());
	}
}