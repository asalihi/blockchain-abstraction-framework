import { JWK } from 'jose';

import { GenericError } from './generic';
import { ERRORS } from '@core/constants/constants';
import { ErrorObject } from '@core/types/types';

export class CryptographyError extends GenericError {
	constructor(code: string, message: string, description: string, resolution: string) {
		super(code, message, description, resolution);
	}
}

export class OutOfRangeError extends CryptographyError {
	constructor(what: string, lowest: number, highest: number, entered: number) {
		const error: ErrorObject = ERRORS.Cryptography.out_of_range_error;
		super(error.code(), error.message(), error.description(what, lowest, highest, entered), error.resolution());
	}
}

export class HashingError extends CryptographyError {
	constructor() {
		const error: ErrorObject = ERRORS.Cryptography.hashing_error;
		super(error.code(), error.message(), error.description(), error.resolution());
	}
}

export class RSAKeyGenerationError extends CryptographyError {
	constructor(kid?: string) {
		const error: ErrorObject = ERRORS.Cryptography.rsa_key_generation_error;
		super(error.code(), error.message(), error.description(kid), error.resolution());
	}
}

export class RSAKeyExportError extends CryptographyError {
	constructor(folder: string) {
		const error: ErrorObject = ERRORS.Cryptography.rsa_key_export_error;
		super(error.code(), error.message(), error.description(folder), error.resolution());
	}
}

export class RSAKeyImportError extends CryptographyError {
	constructor(file: string, kid: string) {
		const error: ErrorObject = ERRORS.Cryptography.rsa_key_import_error;
		super(error.code(), error.message(), error.description(file, kid), error.resolution());
	}
}

export class InvalidJSONWebSignature extends CryptographyError {
	constructor(key: JWK.Key, signature: string) {
		const error: ErrorObject = ERRORS.Cryptography.invalid_json_web_signature;
		super(error.code(), error.message(), error.description(key, signature), error.resolution());
	}
}

export class HTTPRequestSigningError extends CryptographyError {
	constructor() {
		const error: ErrorObject = ERRORS.Cryptography.http_request_signing_error;
		super(error.code(), error.message(), error.description(), error.resolution());
	}
}