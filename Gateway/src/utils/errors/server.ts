import { GenericError } from '@service/utils/errors';
import { ERRORS } from '@service/utils/constants';
import { TokenValue, TokenType, ServerErrorObject, HTTPEndpoint, HTTPMethod } from '@service/utils/types';

export class ServerError extends GenericError {
	public status: number;

	constructor(code: string, status: number, message: string, description: string, resolution: string) {
		super(code, message, description, resolution);
		this.status = status;
	}
}

export class NotFoundError extends ServerError {
	constructor(resource: string) {
		const error: ServerErrorObject = ERRORS.Server.http_404_not_found;
		super(error.code(), error.status(), error.message(), error.description(resource), error.resolution());
	}
}

export class HTTPRequestError extends ServerError {
	constructor(endpoint: HTTPEndpoint, method: HTTPMethod, message: string) {
		const error: ServerErrorObject = ERRORS.Server.error_during_http_request;
		super(error.code(), error.status(), error.message(), error.description(endpoint, method, message), error.resolution());
	}
}

export class InternalServerError extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.http_500_internal_server_error;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class BadRequest extends ServerError {
	constructor(details?: string) {
		const error: ServerErrorObject = ERRORS.Server.bad_request;
		super(error.code(), error.status(), error.message(), error.description(details), error.resolution());
	}
}

export class UnsupportedEndpoint extends ServerError {
	constructor(endpoint: string) {
		const error: ServerErrorObject = ERRORS.Server.http_404_not_found;
		super(error.code(), error.status(), error.message(), error.description(endpoint), error.resolution());
	}
}

export class UnidentifiedUser extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.unidentified_user;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class ExpiredSession extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.expired_session;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class AuthorizationHeaderMissing extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.missing_authorization_header;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class MissingBearerToken extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.missing_bearer_token;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class TokenVerificationError extends ServerError {
	constructor(token: TokenValue) {
		const error: ServerErrorObject = ERRORS.Server.token_verification_error;
		super(error.code(), error.status(), error.message(), error.description(token), error.resolution());
	}
}

export class InvalidTokenType extends ServerError {
	constructor(provided: TokenType, expected: TokenType) {
		const error: ServerErrorObject = ERRORS.Server.invalid_token_type;
		super(error.code(), error.status(), error.message(), error.description(provided, expected), error.resolution(expected));
	}
}

export class TokenReuseError extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.token_reuse_error;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class InvalidSession extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.invalid_session;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class SimultaneousTokenRenew extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.simultaneous_token_renew;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class APISessionGenerationError extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.api_session_generation_error;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class APISessionUpdateError extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.api_session_update_error;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class GenerationOfPairOfTokensError extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.generation_of_pair_of_tokens_error;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class AuthenticationFailed extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.authentication_failed;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class LogoutFailed extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.logout_failed;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class MissingHTTPSignature extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.missing_http_signature;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class HTTPSignatureVerificationError extends ServerError {
	constructor(signature: string) {
		const error: ServerErrorObject = ERRORS.Server.http_signature_verification_error;
		super(error.code(), error.status(), error.message(), error.description(signature), error.resolution());
	}
}

export class InvalidHTTPSignature extends ServerError {
	constructor(signature: string) {
		const error: ServerErrorObject = ERRORS.Server.invalid_http_signature;
		super(error.code(), error.status(), error.message(), error.description(signature), error.resolution());
	}
}

export class HTTPSignatureExpired extends ServerError {
	constructor(expiry: string) {
		const error: ServerErrorObject = ERRORS.Server.http_signature_expired;
		super(error.code(), error.status(), error.message(), error.description(expiry), error.resolution());
	}
}

export class InvalidJWKS extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.invalid_jwks;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}

export class SigningKeyNotFoundInJWKS extends ServerError {
	constructor(kid: string) {
		const error: ServerErrorObject = ERRORS.Server.signing_key_not_found_in_jwks;
		super(error.code(), error.status(), error.message(), error.description(kid), error.resolution());
	}
}

export class InvalidIssuer extends ServerError {
	constructor(found: string, expected: string) {
		const error: ServerErrorObject = ERRORS.Server.invalid_issuer;
		super(error.code(), error.status(), error.message(), error.description(found, expected), error.resolution());
	}
}

export class InvalidMethod extends ServerError {
	constructor(found: string, expected: string) {
		const error: ServerErrorObject = ERRORS.Server.invalid_method;
		super(error.code(), error.status(), error.message(), error.description(found, expected), error.resolution());
	}
}

export class InvalidEndpoint extends ServerError {
	constructor(found: string, expected: string) {
		const error: ServerErrorObject = ERRORS.Server.invalid_endpoint;
		super(error.code(), error.status(), error.message(), error.description(found, expected), error.resolution());
	}
}

export class InvalidData extends ServerError {
	constructor() {
		const error: ServerErrorObject = ERRORS.Server.invalid_data;
		super(error.code(), error.status(), error.message(), error.description(), error.resolution());
	}
}