import { JWK } from 'jose';

import { Errors, HTTPEndpoint, HTTPMethod } from '@core/types/types';

export const PLEASE_RETRY: string = 'Please retry in several minutes.';
export const CONTACT_ADMIN: string = 'If the problem persists, contact the system administrator of the platform';
export const GENERIC_RESOLUTION_MESSAGE: string = `${PLEASE_RETRY} ${CONTACT_ADMIN}`;

export const ERRORS: Errors = {
	API: {},
	Controller: {},
	Cryptography: {
		'out_of_range_error': {
			code: () => 'CRYPTOGRAPHY-E1000',
			message: () => 'Out of range exception',
			description: (parameter: string, lowest: number, highest: number, entered: number) => `Number of ${parameter} provided is out of range (expected to be between ${lowest} and ${highest}, found ${entered})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'hashing_error': {
			code: () => 'CRYPTOGRAPHY-E1001',
			message: () => 'Hash error',
			description: () => 'An error occurred during hashing of data using scrypt algorithm',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'rsa_key_generation_error': {
			code: () => 'CRYPTOGRAPHY-E1002',
			message: () => 'RSA key generation error',
			description: (kid?: string) => 'An unexpected error occurred while generating RSA key pair' + (kid ? ' (provided kid: ' + kid + ')' : ''),
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'rsa_key_export_error': {
			code: () => 'CRYPTOGRAPHY-E1003',
			message: () => 'RSA key export error',
			description: (folder: string) => `An unexpected error occurred while exporting RSA key pair in: ${folder}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'rsa_key_import_error': {
			code: () => 'CRYPTOGRAPHY-E1004',
			message: () => 'RSA key import error',
			description: (file: string, kid: string) => `An unexpected error occurred while importing RSA key ${kid} from: ${file}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_json_web_signature': {
			code: () => 'CRYPTOGRAPHY-E1005',
			message: () => 'Invalid JSON Web Signature',
			description: (key: JWK.Key, signature: string) => `Signature could not be verified using provided key (key: ${key.kid}, signature: ${signature})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'http_request_signing_error': {
			code: () => 'CRYPTOGRAPHY-E1006',
			message: () => 'HTTP request signing error',
			description: () => 'An unexpected error occurred while signing HTTP request',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		}
	},
	Database: {
		'query_execution_error': {
			code: () => 'DATABASE-E1000',
			message: () => 'Database error',
			description: (type: string) => `An internal error occurred at database level during ${type}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'element_not_found': {
			code: () => 'DATABASE-E1001',
			message: (element: string) => `${element.toUpperCase()} not found`,
			description: (element: string, identifier: string) => `${element.toUpperCase()} was not found in database (identifier: ${identifier})`,
			resolution: (element: string) => `Verify if the provided identifier is correct and matches an existing ${element}`
		}
	},
	RabbitMQ: {
		'connection_failed': {
			code: () => 'RABBITMQ-E1000',
			message: () => 'Connection failed',
			description: (connection_string: string) => `Connection to message queue failed (${connection_string})`,
			resolution: () => `Check if connection string and configuration of RabbitMQ are correct. ${CONTACT_ADMIN}`
		}
    },
	Server: {
		'http_404_not_found': {
			code: () => 'SERVER-E404',
			status: () => 404,
			message: () => 'Resource not found',
			description: (resource: string) => `The requested resource does not exist: ${resource}`,
			resolution: () => 'Check if endpoint exists in the API documentation and look for any spelling mistake'
		},
		'http_500_internal_server_error': {
			code: () => 'SERVER-E500',
			status: () => 500,
			message: () => 'Internal server error',
			description: (details?: string) => 'An internal server error occurred' + (details ? ' (' + details + ')' : ''),
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'bad_request': {
			code: () => 'SERVER-E400',
			status: () => 400,
			message: () => 'Bad request',
			description: (details?: string) => `Request is malformed (${details ?? 'one or more parameters are missing or incorrect'})`,
			resolution: () => 'You should provide all required parameters as per the official API documentation'
		},
		'error_during_http_request': {
			code: () => 'SERVER-E1000',
			status: () => 500,
			message: () => 'HTTP request could not be handled correctly',
			description: (endpoint: HTTPEndpoint, method: HTTPMethod, message: string) => `An error occurred while handling the request (endpoint: ${endpoint}, method: ${method}, error: ${message})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'jwks_retrieval_error': {
			code: () => 'SERVER-E1001',
			status: () => 500,
			message: () => 'Could not retrieve JWKS',
			description: () => 'API server tried to retrieve JWKS from gateway endpoint but an unexpected error occurred',
			resolution: () => `Ensure that the gateway is accepting requests and that JWKS is available. ${CONTACT_ADMIN}`
		},
		'missing_authorization_header': {
			code: () => 'SERVER-E1002',
			status: () => 401,
			message: () => 'Authorization header not found',
			description: () => 'No \'Authorization\' header was found in the incoming request',
			resolution: () => 'No direct access to this API is allowed. You should use the API provided by the gateway of the platform.'
		},
		'missing_http_signature': {
			code: () => 'SERVER-E1003',
			status: () => 401,
			message: () => 'HTTP signature not found',
			description: () => 'No HTTP signature was found in \'Authorization\' header',
			resolution: () => 'No direct access to this API is allowed. You should use the API provided by the gateway of the platform.'
		},
		'http_signature_verification_error': {
			code: () => 'SERVER-E1004',
			status: () => 500,
			message: () => 'HTTP signature could not be verified',
			description: (signature: string) => `An unexpected error occurred while verifying HTTP signature: ${signature}`,
			resolution: () => `Please verify that the provided signature is valid. ${CONTACT_ADMIN}`
		},
		'invalid_http_signature': {
			code: () => 'SERVER-E1005',
			status: () => 401,
			message: () => 'Authentication failed',
			description: (signature: string) => `The provided HTTP signature is invalid: ${signature}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'http_signature_expired': {
			code: () => 'SERVER-E1006',
			status: () => 401,
			message: () => 'HTTP signature expired',
			description: (expiry: string) => `The provided HTTP signature has expired on: ${expiry}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_jwks': {
			code: () => 'SERVER-E1007',
			status: () => 401,
			message: () => 'Invalid JWKS endpoint',
			description: () => 'The JWKS provided with the HTTP signature is not the one used by the gateway',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'signing_key_not_found_in_jwks': {
			code: () => 'SERVER-E1008',
			status: () => 500,
			message: () => 'Signing key was not found',
			description: (kid: string) => `The signing key used to sign HTTP request was not found in JWKS (kid: ${kid})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_issuer': {
			code: () => 'SERVER-E1009',
			status: () => 401,
			message: () => 'Invalid issuer',
			description: (found: string, expected: string) => `Issuer of the HTTP signature is invalid (found: ${found}, expected: ${expected})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_method': {
			code: () => 'SERVER-E1010',
			status: () => 401,
			message: () => 'Invalid method',
			description: (found: string, expected: string) => `Method of the incoming request is not one specified in HTTP signature (found: ${found}, expected: ${expected})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_endpoint': {
			code: () => 'SERVER-E1011',
			status: () => 401,
			message: () => 'Invalid endpoint',
			description: (found: string, expected: string) => `Endpoint of the incoming request is not one specified in HTTP signature (found: ${found}, expected: ${expected})`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'invalid_data': {
			code: () => 'SERVER-E1012',
			status: () => 401,
			message: () => 'Invalid data',
			description: () => 'The hash of the data provided in the incoming request does not match one stored in the HTTP signature',
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		}
	},
	Utility: {
		'read_file_error': {
			code: () => 'UTILITY-E1000',
			message: () => 'File could not be read',
			description: (file: string) => `An unexpected error occurred while trying to read file: ${file}`,
			resolution: () => `Ensure that the file exists at provided location and try again. ${CONTACT_ADMIN}`
		},
		'write_file_error': {
			code: () => 'UTILITY-E1001',
			message: () => 'File could not be written',
			description: (file: string) => `An unexpected error occurred while trying to write data to file: ${file}`,
			resolution: () => `Ensure that the destination folder exists and write permission is correctly set, then try again. ${CONTACT_ADMIN}`
		},
		'directory_creation_error': {
			code: () => 'UTILITY-E1002',
			message: () => 'Directory could not be created',
			description: (directory: string) => `An unexpected error occurred while trying to create directory: ${directory}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		},
		'conversion_error': {
			code: () => 'UTILITY-E1003',
			message: (type: string) => `Error occurred during conversion of data to ${type}`,
			description: (what: string, type: string) => `An unexpected error occurred while trying to convert \'${what}\' to ${type}`,
			resolution: () => `Ensure that the format of data to convert is correct and retry. ${CONTACT_ADMIN}`
		},
		'date_manipulation_error': {
			code: () => 'U-E1004',
			message: () => 'Error occurred during manipulation of date',
			description: (manipulation: string) => `An unexpected error occurred while trying to perform the following operation on date: ${manipulation}`,
			resolution: () => GENERIC_RESOLUTION_MESSAGE
		}
	}
}