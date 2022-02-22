import { ERRORS, GENERIC_RESOLUTION_MESSAGE } from 'core';

ERRORS['Controller'] = {
	'invalid_process_signature': {
		code: () => 'T-E1000',
		message: () => 'Invalid process signature',
		description: (process: string) => `The signature of the process is invalid (process: ${process})`,
		resolution: () => GENERIC_RESOLUTION_MESSAGE
	},
	'invalid_process_version_signature': {
		code: () => 'T-E1001',
		message: () => 'Invalid process version signature',
		description: (process: string, version: string) => `The signature of the process version is invalid (process: ${process}, version: ${version})`,
		resolution: () => GENERIC_RESOLUTION_MESSAGE
	},
	'invalid_execution_instance_signature': {
		code: () => 'T-E1002',
		message: () => 'Invalid execution instance signature',
		description: (instance: string) => `The signature of the execution instance is invalid (instance: ${instance})`,
		resolution: () => GENERIC_RESOLUTION_MESSAGE
	}
};

export { ERRORS };