import { DLTNetwork, SupportedConsensusAlgorithmTypes, SupportedPlatformTypes, SupportedGovernanceTypes, SupportedImmutabilityTypes, SupportedScalabilityLevels } from './types';


export enum DLTInstanceState {
	ACTIVE = 'active',
	INSTALLING = 'installing',
	INSTALLING_MANUALLY = 'installing (manual mode)',
	UNAVAILABLE = 'unavailable',
	PAUSED = 'paused',
	DEACTIVATING = 'deactivating',
	DEACTIVATED = 'deactivated'
};

export interface IDLTInstanceProfileSchema {
	'consensus': {
		'type': SupportedConsensusAlgorithmTypes,
		'algorithms': string[],
		'energy-saving': Boolean
	},
	'contract': {
		'support': Boolean,
		'completeness': Boolean,
		'languages': string[]
	},
	'currency': Boolean,
	'decentralization': number,
	'fees': number,
	'finality': number,
	'governance': {
		'open-source': Boolean,
		'type': SupportedGovernanceTypes
	},
	'immutability': SupportedImmutabilityTypes,
	'lightnode': Boolean,
	'maturity': number,
	'platform': SupportedPlatformTypes,
	'privacy': {
		'participants': Boolean,
		'transactions': Boolean
	},
	'scalability': SupportedScalabilityLevels,
	'security': {
		'quantum-resistant': Boolean,
		'fault-tolerance': number
	},
	'storage': Boolean,
	'throughput': number,
	'tokenization': Boolean
}

export interface IDLTInstanceSchema {
    'identifier': string,
    'network': DLTNetwork,
    'creation': Date,
    'desactivation'?: Date,
    'state': DLTInstanceState,
    'configuration': { [key: string]: any },
    'profile': IDLTInstanceProfileSchema
}