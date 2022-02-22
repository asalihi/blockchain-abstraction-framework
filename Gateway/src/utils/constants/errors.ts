import { JWK } from 'jose';

import { Errors, HTTPEndpoint, HTTPMethod, UserRole, TokenType, TokenPayload } from '@service/utils/types';
import { TokenValue } from '../types/authentication';

const PLEASE_RETRY: string = 'Please retry in several minutes.';
const CONTACT_ADMIN: string = 'If the problem persists, contact the system administrator of the platform';
const GENERIC_RESOLUTION_MESSAGE: string = `${PLEASE_RETRY} ${CONTACT_ADMIN}`;

export const ERRORS: Errors = {
	Utility: {
		'read_file_error': {
			code: () => 'U-E1000',
			message: () => 'File could not be read',
			description: (file: string) => `An unexpected error occurred while trying to read file: ${file}`,
			resolution: () => `Ensure that the file exists at provided location and try again. ${CONTACT_ADMIN}`
		},
		'write_file_error': {
			code: () => 'U-E1001',
			message: () => 'File could not be written',
			description: (file: string) => `An unexpected error occurred while trying to write data to file: ${file}`,
			resolution: () => `Ensure that the destination folder exists and write permission is correctly set, then try again. ${CONTACT_ADMIN}`
		},
		'directory_creation_error': {
			code: () => 'U-E1002',
			message: () => 'Directory could not be created',
			description: (directory: string) => `An unexpected error occurred while trying to create directory: ${directory}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_duration': {
			code: () => 'U-E1003',
			message: () => 'Invalid duration provided',
			description: (duration: string) => `An invalid duration was given for conversion in seconds: ${duration}`,
			resolution: () => 'The duration should be in the following formats: \'<value><unit>\' or \'<value> <unit>\' (where <value> is a strictly positive number and <unit> is one of: \'s(ec(s))\', \'second(s)\', \'m(in(s))\', \'minute(s)\', \'h(r(s))\', \'hour(s)\', \'d(ay(s))\', \'w(eek(s))\', \'y(r(s))\', \'year(s)\')'
		},
		'conversion_error': {
			code: () => 'U-E1004',
			message: (type: string) => `Error occurred during conversion of data to ${type}`,
			description: (what: string, type: string) => `An unexpected error occurred while trying to convert \'${what}\' to ${type}`,
			resolution: () => `Ensure that the format of data to convert is correct and retry. ${CONTACT_ADMIN}`
		},
		'date_manipulation_error': {
			code: () => 'U-E1005',
			message: () => 'Error occurred during manipulation of date',
			description: (manipulation: string) => `An unexpected error occurred while trying to perform the following operation on date: ${manipulation}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		}
	},
	Server: {
		'http_404_not_found': {
			code: () => 'S-E404',
			status: () => 404,
			message: () => 'Resource not found',
			description: (resource: string) => `The requested resource does not exist: ${resource}`,
			resolution: () => 'Check if endpoint exists in the API documentation and look for any spelling mistake'
		},
		'error_during_http_request': {
			code: () => 'S-E1000',
			status: () => 500,
			message: () => 'HTTP request could not be handled correctly',
			description: (endpoint: HTTPEndpoint, method: HTTPMethod, message: string) => `An error occurred while handling the request (endpoint: ${endpoint}, method: ${method}, message: ${message})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'http_500_internal_server_error': {
			code: () => 'S-E500',
			status: () => 500,
			message: () => 'Internal server error',
			description: (details?: string) => 'An internal server error occurred' + (details ? ' (' + details + ')' : ''),
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'bad_request': {
			code: () => 'S-E400',
			status: () => 400,
			message: () => 'Bad request',
			description: (details?: string) => `Request is malformed (${details ?? 'one or more parameters are missing or incorrect'})`,
			resolution: () => 'You should provide all required parameters as per the official API documentation'
		},
		'unsupported_endpoint': {
			code: () => 'S-E1000',
			status: () => 404,
			message: () => 'Endpoint not found',
			description: (endpoint: string) => `The requested endpoint does not exist: ${endpoint}`,
			resolution: () => 'Check if endpoint exists in the API documentation and look for any spelling mistake'
		},
		'unidentified_user': {
			code: () => 'S-E1001',
			status: () => 401,
			message: () => 'Identity of caller could not be retrieved',
			description: () => 'API endpoint is protected and no session was found in HTTP request',
			resolution: () => `Ensure that you are currently logged in and/or credentials have been set accordingly. ${CONTACT_ADMIN}`
		},
		'expired_session': {
			code: () => 'S-E1002',
			status: () => 401,
			message: () => 'Session has expired',
			description: () => 'Global session has expired and should be renewed',
			resolution: () => 'Submit credentials again to gateway server to generate a new session and obtain new pair of tokens'
		},
		'missing_authorization_header': {
			code: () => 'S-E1003',
			status: () => 401,
			message: () => 'Authorization header not found',
			description: () => 'No \'Authorization\' header was found in the incoming request',
			resolution: () => 'For protected endpoints, please ensure that \'Authorization\' header is set with the following format: \'Bearer <token>\' (where token is a JWT bearer token provided by the authentication server)'
		},
		'missing_bearer_token': {
			code: () => 'S-E1004',
			status: () => 401,
			message: () => 'Bearer token not found',
			description: () => 'No bearer token was found in \'Authorization\' header',
			resolution: () => 'For protected endpoints, please ensure that a bearer token is set in the \'Authorization\' header, as follow: \'Bearer <token>\''
		},
		'token_verification_error': {
			code: () => 'S-E1005',
			status: () => 401,
			message: () => 'Bearer token could not be verified',
			description: (token: string) => `An unexpected error occurred while verifying bearer token: ${token}`,
			resolution: () => `Please verify that the provided token has a valid signature and valid claims. ${CONTACT_ADMIN}`
		},
		'invalid_token_type': {
			code: () => 'S-E1006',
			status: () => 401,
			message: () => 'Invalid token type',
			description: (provided: TokenType, expected: TokenType) => `Bearer token should be of type ${expected} (found: ${provided})`,
			resolution: (expected: TokenType) => `Please provide a token of type: ${expected}`
		},
		'token_reuse_error': {
			code: () => 'S-E1007',
			status: () => 401,
			message: () => 'Refresh token used multiple times',
			description: () => 'Provided refresh token has already been used to generate a new pair of tokens (either by mistake, or as a result of an attack)',
			resolution: () => 'Login again to start a new session and generate a new pair of tokens. If the problem persists, take action to secure your account and contact the system administrator of the platform, if necessary.'
		},
		'invalid_session': {
			code: () => 'S-E1008',
			status: () => 401,
			message: () => 'Session associated to refresh token is invalid',
			description: () => 'Provided refresh token is valid but not linked to current session',
			resolution: () => 'Login again to generate a new pair of tokens. If the problem persists, take action to secure your account and contact the system administrator of the platform.'
		},
		'simultaneous_token_renew': {
			code: () => 'S-E1009',
			status: () => 401,
			message: () => 'Renewal of refresh token has been performed multiple times simultaneously',
			description: () => 'API gateway received at least two requests at the same time to generate new refresh token during last renewal period',
			resolution: () => 'This situation usually occurs during an attack. You should immediately secure your account and contact the system administrator of the platform.'
		},
		'api_session_generation_error': {
			code: () => 'S-E1010',
			status: () => 500,
			message: () => 'Internal server error',
			description: () => 'Generation of a new API session could not be achieved',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'api_session_update_error': {
			code: () => 'S-E1011',
			status: () => 500,
			message: () => 'Internal server error',
			description: () => 'Update of existing API session could not be achieved',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'generation_of_pair_of_tokens_error': {
			code: () => 'S-E1012',
			status: () => 500,
			message: () => 'Internal server error',
			description: () => 'New pair of tokens could not be generated',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'authentication_failed': {
			code: () => 'S-E1013',
			status: () => 401,
			message: () => 'Authentication failed',
			description: () => 'An error occurred during authentication',
			resolution: () => `Verify if credentials are correctly sent and valid. ${CONTACT_ADMIN}`
		},
		'logout_failed': {
			code: () => 'S-E1014',
			status: () => 500,
			message: () => 'Internal server error',
			description: () => 'An error occurred during logout and you may still be logged in',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'missing_http_signature': {
			code: () => 'SERVER-E1015',
			status: () => 401,
			message: () => 'HTTP signature not found',
			description: () => 'No HTTP signature was found in \'Authorization\' header',
			resolution: () => 'No direct access to this API is allowed. You should use the API provided by the gateway of the platform.'
		},
		'http_signature_verification_error': {
			code: () => 'SERVER-E1016',
			status: () => 500,
			message: () => 'HTTP signature could not be verified',
			description: (signature: string) => `An unexpected error occurred while verifying HTTP signature: ${signature}`,
			resolution: () => `Please verify that the provided signature is valid. ${CONTACT_ADMIN}`
		},
		'invalid_http_signature': {
			code: () => 'SERVER-E1017',
			status: () => 401,
			message: () => 'Authentication failed',
			description: (signature: string) => `The provided HTTP signature is invalid: ${signature}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'http_signature_expired': {
			code: () => 'SERVER-E1018',
			status: () => 401,
			message: () => 'HTTP signature expired',
			description: (expiry: string) => `The provided HTTP signature has expired on: ${expiry}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_jwks': {
			code: () => 'SERVER-E1019',
			status: () => 401,
			message: () => 'Invalid JWKS endpoint',
			description: () => 'The JWKS provided with the HTTP signature is not the one used by the gateway',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'signing_key_not_found_in_jwks': {
			code: () => 'SERVER-E1020',
			status: () => 500,
			message: () => 'Signing key was not found',
			description: (kid: string) => `The signing key used to sign HTTP request was not found in JWKS (kid: ${kid})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_issuer': {
			code: () => 'SERVER-E1021',
			status: () => 401,
			message: () => 'Invalid issuer',
			description: (found: string, expected: string) => `Issuer of the HTTP signature is invalid (found: ${found}, expected: ${expected})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_method': {
			code: () => 'SERVER-E1022',
			status: () => 401,
			message: () => 'Invalid method',
			description: (found: string, expected: string) => `Method of the incoming request is not one specified in HTTP signature (found: ${found}, expected: ${expected})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_endpoint': {
			code: () => 'SERVER-E1023',
			status: () => 401,
			message: () => 'Invalid endpoint',
			description: (found: string, expected: string) => `Endpoint of the incoming request is not one specified in HTTP signature (found: ${found}, expected: ${expected})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_data': {
			code: () => 'SERVER-E1024',
			status: () => 401,
			message: () => 'Invalid data',
			description: () => 'The hash of the data provided in the incoming request does not match one stored in the HTTP signature',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		}
	},
	API: {
		'user_not_found': {
			code: () => 'A-E1001',
			status: () => 404,
			message: () => 'Not found',
			description: (username: string) => `User not found: ${username}`,
			resolution: () => 'Verify if the username is spelled correctly and try again. If the user does not exist, you should create it.'
		},
		'endpoint_generic_error': {
			code: () => 'A-E1002',
			status: () => 500,
			message: () => 'Unexpected error occurred',
			description: (endpoint: string) => `An unexpected error occurred while trying to reach endpoint: ${endpoint}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'bad_request': {
			code: () => 'A-E1003',
			status: () => 400,
			message: () => 'Bad request',
			description: () => 'Request is malformed (one or more parameters are missing or incorrect)',
			resolution: () => 'You should provide all required parameters as per the official API documentation'
		},
		'user_manipulation_error': {
			code: () => 'A-E1004',
			status: () => 500,
			message: () => 'Internal server error',
			description: (operation: string, username: string) => `An unexpected error occurred during ${operation} of user: ${username}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'permission_denied': {
			code: () => 'A-E1005',
			status: () => 403,
			message: () => 'Unauthorized',
			description: (role: UserRole, expected: UserRole[]) => `You don't have the required role to access this endpoint (your role: ${role}, expected: ${expected.join(', ')})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'initialization_error': {
			code: () => 'A-E1006',
			status: () => 500,
			message: () => 'Internal server error',
			description: () => 'An unexpected error occurred during initialization process',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'unauthorized_initialization': {
			code: () => 'A-E1007',
			status: () => 403,
			message: () => 'Unauthorized',
			description: () => 'Initialization of the platform is not allowed',
			resolution: () => `You should use an account with '${UserRole.SUPERUSER}' role to access the platform`
		}
	},
	Cryptography: {
		'out_of_range_error': {
			code: () => 'C-E1000',
			message: () => 'Out of range exception',
			description: (parameter: string, lowest: number, highest: number, entered: number) => `Number of ${parameter} provided is out of range (expected to be between ${lowest} and ${highest}, found ${entered})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'hashing_error': {
			code: () => 'C-E1001',
			message: () => 'Hash error',
			description: () => 'An error occurred during hashing of data using scrypt algorithm',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'rsa_key_generation_error': {
			code: () => 'C-E1002',
			message: () => 'RSA key generation error',
			description: (kid?: string) => 'An unexpected error occurred while generating RSA key pair' + (kid ? ' (provided kid: ' + kid + ')' : ''),
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'rsa_key_export_error': {
			code: () => 'C-E1003',
			message: () => 'RSA key export error',
			description: (folder: string) => `An unexpected error occurred while exporting RSA key pair in: ${folder}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'rsa_key_import_error': {
			code: () => 'C-E1004',
			message: () => 'RSA key import error',
			description: (file: string, kid: string) => `An unexpected error occurred while importing RSA key ${kid} from: ${file}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'token_signing_error': {
			code: () => 'C-E1005',
			message: () => 'JWT signing error',
			description: (kid: string, payload: TokenPayload) => `An unexpected error occurred while signing the following token payload with key '${kid}': ${JSON.stringify(payload)}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'http_request_signing_error': {
			code: () => 'C-E1006',
			message: () => 'HTTP request signing error',
			description: () => 'An unexpected error occurred while signing HTTP request',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_token': {
			code: () => 'C-E1007',
			message: () => 'Invalid token',
			description: (key: JWK.RSAKey, token: TokenValue) => `Verification of token with key '${key.kid}' failed (token: ${token})`,
			resolution: () => 'Please ensure you provided a token with a valid signature.'
		},
		'invalid_json_web_signature': {
			code: () => 'C-E1008',
			message: () => 'Invalid JSON Web Signature',
			description: (key: JWK.RSAKey, signature: string) => `Verification of signature with key '${key.kid}' failed (signature: ${signature})`,
			resolution: () => `Please retry signing the original content or verify that the provided key is correct. ${CONTACT_ADMIN}`
		}
	},
	Database: {
		'query_execution_error': {
			code: () => 'D-E1000',
			message: () => 'Database error',
			description: (type: string) => `An internal error occurred at database level during ${type}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'element_not_found': {
			code: () => 'D-E1001',
			message: (element: string) => `${element.toUpperCase()} not found`,
			description: (element: string, identifier: string) => `${element.toUpperCase()} was not found in database (identifier: ${identifier})`,
			resolution: (element: string) => `Verify if the provided identifier is correct and matches an existing ${element}`
		}
	}
}