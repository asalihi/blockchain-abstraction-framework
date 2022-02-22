import { DAYS_OF_WEEK, CONSENSUS_ALGORITHMS, ARCHITECTURE_TYPES, GOVERNANCE_TYPES, IMMUTABILITY_TYPES, SMART_CONTRACT_LANGUAGES, SCALABILITY_LEVELS, SUPPORTED_NETWORKS, SUPPORTED_PLATFORMS_FOR_STORAGE, SUPPORTED_TIME_UNITS } from '@core/constants/constants';
import { Identifier } from '@core/types/types';

export type Range = { min: number, max: number };

export type Fees = { 'low': Range, 'medium': Range, 'high': Range }

export type SupportedConsensusAlgorithms = typeof CONSENSUS_ALGORITHMS[number];
export type SupportedConsensusAlgorithmTypes = typeof ARCHITECTURE_TYPES[number];

export type SupportedGovernanceTypes = typeof GOVERNANCE_TYPES[number];

export type SupportedImmutabilityTypes = typeof IMMUTABILITY_TYPES[number];

export type SupportedSmartContractLanguages = typeof SMART_CONTRACT_LANGUAGES[number];

export type SupportedScalabilityLevels = typeof SCALABILITY_LEVELS[number];

export type SupportedNetworks = typeof SUPPORTED_NETWORKS[number];

export type SupportedPlatformsForStorage = typeof SUPPORTED_PLATFORMS_FOR_STORAGE[number];
export type SupportedPlatformTypes = typeof ARCHITECTURE_TYPES[number];

export type SupportedTimeUnits = typeof SUPPORTED_TIME_UNITS[number];

export type ThroughputLevels = { 'low': Range, 'medium': Range, 'high': Range };

export type DLTInstanceProfile = {
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
};

/*export type Instance = { 'identifier': string, 'creation': Date, 'network': SupportedNetworks, 'parameters': InstanceParameters };
export type InstanceParameters = {
	'consensus': {
		'type': SupportedConsensusAlgorithmTypes,
		'algorithms': SupportedConsensusAlgorithms[],
		'energy-saving': Boolean
	},
	'contract': {
		'support': Boolean,
		'completeness': Boolean,
		'languages': SupportedSmartContractLanguages[]
	},
	'currency': {
		'support': Boolean
	},
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
	'throughput': number,
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
	'tokenization': Boolean
};*/

export type EnforcementRules = { 'date': Partial<DateRules>, 'time': Partial<TimeRules> };

export type DaysOfWeek = typeof DAYS_OF_WEEK[number];
export type DateRules = {
	'before': string,
	'after': string,
	'between': {
		'date1': string,
		'date2': string
	},
	'days': Number[],
	'months': Number[],
	'years': Number[],
	'weekdays': DaysOfWeek[]
};

export type Time = { 'hours': string, 'minutes': string };
export type TimeRules = {
	'before': string,
	'after': string,
	'between': {
		'time1': string,
		'time2': string
	}
};

export type RawCriterionType = number | Boolean | string | Range;
export type CriterionType = RawCriterionType | RawCriterionType[];
export type Criterion<T extends CriterionType> = { 'value': T, 'weight': -1 | 0 | 1 | 2 | 3 | 4 | 5 | 'UNDESIRABLE' | 'REQUIRED' };
export type ListOfCriteria<T extends CriterionType> = Criterion<T>[];
export type DLTPlatformSelectors = { 'instances': string[], 'networks': SupportedNetworks[] };
export type DLTConsensusCriteria = { 'type': ListOfCriteria<SupportedConsensusAlgorithmTypes>, 'algorithms': ListOfCriteria<SupportedConsensusAlgorithms[]>, 'energy-saving': ListOfCriteria<Boolean> };
export type DLTContractCriteria = { 'support': ListOfCriteria<Boolean>, 'completeness': ListOfCriteria<Boolean>, 'languages': ListOfCriteria<SupportedSmartContractLanguages[]> };
export type DLTCurrencyCriteria = { 'support': ListOfCriteria<Boolean> };
export type DLTDecentralizationCriteria = { 'score': ListOfCriteria<Range> };
export type DLTFeesCriteria = { 'ranges': ListOfCriteria<Range>, 'category': ListOfCriteria<keyof Fees> };
export type DLTFinalityCriteria = { 'delay': ListOfDelays };
export type ListOfDelays = { 'ranges': ListOfCriteria<Range>, 'unit'?: SupportedTimeUnits };
export type DLTGovernanceCriteria = { 'type': ListOfCriteria<SupportedGovernanceTypes>, 'open-source': ListOfCriteria<Boolean> };
export type DLTImmutabilityCriteria = { 'type': ListOfCriteria<SupportedImmutabilityTypes> };
export type DLTLightnodeCriteria = { 'support': ListOfCriteria<Boolean> };
export type DLTMaturityCriteria = { 'score': ListOfCriteria<Range> };
export type DLTPerformanceCriteria = { 'throughput': ListOfCriteria<Range>, 'category': ListOfCriteria<keyof ThroughputLevels> };
export type DLTPlatformCriteria = { 'type': ListOfCriteria<string> };
export type DLTPrivacyCriteria = { 'participants': ListOfCriteria<Boolean>, 'transactions': ListOfCriteria<Boolean> };
export type DLTScalabilityCriteria = { 'level': ListOfCriteria<SupportedScalabilityLevels> };
export type DLTSecurityCriteria = { 'quantum-resistant': ListOfCriteria<Boolean>, 'fault-tolerance': ListOfCriteria<number> };
export type StorageCriteria = { 'encryption': ListOfCriteria<Boolean>, 'location': ListOfCriteria<SupportedPlatformsForStorage>, 'proof': ListOfCriteria<SupportedPlatformsForStorage> };
export type DLTTokenizationCriteria = { 'support': ListOfCriteria<Boolean> };
// TODO: Change name to DLTSelectionCriteria (or DLTCriteria)
export type DLTSelectionCriteria = {
	'enforcement': Partial<EnforcementRules>,
	'consensus': DLTConsensusCriteria,
	'contract': DLTContractCriteria,
	'currency': DLTCurrencyCriteria,
	'decentralization': DLTDecentralizationCriteria,
	'fees': DLTFeesCriteria,
	'finality': DLTFinalityCriteria,
	'governance': DLTGovernanceCriteria,
	'immutability': DLTImmutabilityCriteria,
	'lightnode': DLTLightnodeCriteria,
	'maturity': DLTMaturityCriteria,
	'performance': DLTPerformanceCriteria,
	'platform': DLTPlatformCriteria,
	'privacy': DLTPrivacyCriteria,
	'scalability': DLTScalabilityCriteria,
	'security': DLTSecurityCriteria,
	'storage': StorageCriteria,
	'tokenization': DLTTokenizationCriteria
};

export type CriterionName = string;
export type CriterionScore = { value: number, weight: number };
export type ListOfScores = CriterionScore[];
export type ListOfCriteriaWithScores = Map<CriterionName, ListOfScores>;
export type Matrix = Map<Identifier, ListOfCriteriaWithScores>;

export type Distances = { 'positive_distance': number, 'negative_distance': number };

export type Score = number;