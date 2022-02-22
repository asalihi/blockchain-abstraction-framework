import { JWK } from 'jose';

import { ERRORS } from '@service/utils/constants';
import { GenericError } from '@service/utils/errors';
import { ErrorObject } from '@service/utils/types';
import { TokenValue } from '../types/authentication';

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

export class TokenSigningError extends CryptographyError {
	constructor(kid: string, payload: Object) {
		const error: ErrorObject = ERRORS.Cryptography.token_signing_error;
		super(error.code(), error.message(), error.description(kid, payload), error.resolution());
	}
}

export class HTTPRequestSigningError extends CryptographyError {
	constructor() {
		const error: ErrorObject = ERRORS.Cryptography.http_request_signing_error;
		super(error.code(), error.message(), error.description(), error.resolution());
	}
}

export class InvalidToken extends CryptographyError {
	constructor(key: JWK.RSAKey, token: TokenValue) {
		const error: ErrorObject = ERRORS.Cryptography.invalid_token;
		super(error.code(), error.message(), error.description(key, token), error.resolution());
	}
}

export class InvalidJSONWebSignature extends CryptographyError {
	constructor(key: JWK.RSAKey, signature: string) {
		const error: ErrorObject = ERRORS.Cryptography.invalid_json_web_signature;
		super(error.code(), error.message(), error.description(key, signature), error.resolution());
	}
}