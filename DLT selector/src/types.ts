import { IDLTInstanceSchema } from './interfaces';
import { ARCHITECTURE_TYPES, CONSENSUS_ALGORITHMS, DLT_NETWORKS, GOVERNANCE_TYPES, IMMUTABILITY_TYPES, SMART_CONTRACT_LANGUAGES, SCALABILITY_LEVELS, SUPPORTED_NETWORKS, SUPPORTED_PLATFORMS_FOR_STORAGE, SUPPORTED_TIME_UNITS } from './constants';

export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

export type DLTNetwork = typeof DLT_NETWORKS[number];

export type CriterionName = string;
export type CriterionScore = {value: number, weight: number};
export type ListOfScores = CriterionScore[];
export type ListOfCriteriaWithScores = Map<CriterionName, ListOfScores>;
export type Matrix = Map<IDLTInstanceSchema, ListOfCriteriaWithScores>;
export type ListOfWeightedScores = number[];
export type ListOfCriteriaWithWeightedScores = Map<CriterionName, ListOfWeightedScores>;
export type WeightedMatrix = Map<IDLTInstanceSchema, ListOfCriteriaWithWeightedScores>;
export type Distances = { 'positive_distance': number, 'negative_distance': number };
export type Score = number;

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
export type ThroughputLevels = { 'low': Range, 'medium': Range,	'high': Range };
export type RawCriterionType = number|Boolean|string|Range;
export type CriterionType = RawCriterionType|RawCriterionType[];
export type Criterion<T extends CriterionType> = { 'value': T, 'weight': -1|0|1|2|3|4|5|'UNDESIRABLE'|'REQUIRED' };
export type ListOfCriteria<T extends CriterionType> = Criterion<T>[];
export type PlatformSelectors = { 'instances': string[], 'networks': SupportedNetworks[] };
export type ConsensusCriteria = { 'type': ListOfCriteria<SupportedConsensusAlgorithmTypes>, 'algorithms': ListOfCriteria<SupportedConsensusAlgorithms[]>, 'energy-saving': ListOfCriteria<Boolean> };
export type ContractCriteria = { 'support': ListOfCriteria<Boolean>, 'completeness': ListOfCriteria<Boolean>, 'languages': ListOfCriteria<SupportedSmartContractLanguages[]> };
export type CurrencyCriteria = { 'support': ListOfCriteria<Boolean> };
export type DecentralizationCriteria = { 'score': ListOfCriteria<Range> };
export type FeesCriteria = { 'ranges': ListOfCriteria<Range>, 'category': ListOfCriteria<keyof Fees> };
export type FinalityCriteria = { 'delay': ListOfDelays };
export type ListOfDelays = { 'ranges': ListOfCriteria<Range>, 'unit'?: SupportedTimeUnits };
export type GovernanceCriteria = { 'type': ListOfCriteria<SupportedGovernanceTypes>, 'open-source': ListOfCriteria<Boolean> };
export type ImmutabilityCriteria = { 'type': ListOfCriteria<SupportedImmutabilityTypes> };
export type LightnodeCriteria = { 'support': ListOfCriteria<Boolean> };
export type MaturityCriteria = { 'score': ListOfCriteria<Range> };
export type PerformanceCriteria = { 'throughput': ListOfCriteria<Range>, 'category': ListOfCriteria<keyof ThroughputLevels> };
export type PlatformCriteria = { 'type': ListOfCriteria<string> };
export type PrivacyCriteria = { 'participants': ListOfCriteria<Boolean>, 'transactions': ListOfCriteria<Boolean> };
export type ScalabilityCriteria = { 'level': ListOfCriteria<SupportedScalabilityLevels> };
export type SecurityCriteria = { 'quantum-resistant': ListOfCriteria<Boolean>, 'fault-tolerance': ListOfCriteria<number> };
export type StorageCriteria = { 'encryption': ListOfCriteria<Boolean>, 'location': ListOfCriteria<SupportedPlatformsForStorage>, 'proof': ListOfCriteria<SupportedPlatformsForStorage> };
export type TokenizationCriteria = { 'support': ListOfCriteria<Boolean> };
export type DLTSelectionCriteria = {
	'consensus': ConsensusCriteria,
	'contract': ContractCriteria,
	'currency': CurrencyCriteria,
	'decentralization': DecentralizationCriteria,
	'fees': FeesCriteria,
	'finality': FinalityCriteria,
	'governance': GovernanceCriteria,
	'immutability': ImmutabilityCriteria,
	'lightnode': LightnodeCriteria,
	'maturity': MaturityCriteria,
	'performance': PerformanceCriteria,
	'platform': PlatformCriteria,
	'privacy': PrivacyCriteria,
	'scalability': ScalabilityCriteria,
	'security': SecurityCriteria,
	'storage': StorageCriteria,
	'tokenization': TokenizationCriteria
};