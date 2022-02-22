import { SupportedConsensusAlgorithmTypes, SupportedPlatformTypes, SupportedGovernanceTypes, SupportedImmutabilityTypes, SupportedScalabilityLevels } from 'core';

export interface IDLTInstanceProfileSchema {
	'instance': string,
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