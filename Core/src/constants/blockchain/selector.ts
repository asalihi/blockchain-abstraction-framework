import { DaysOfWeek, Fees, Range } from '@core/types/types';
import { DLT_NETWORKS } from '@core/constants/constants';

export const DAYS_OF_WEEK: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_OF_WEEK_MAPPING: { [key: number]: DaysOfWeek } = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

export const ARCHITECTURE_TYPES: string[] = ['public', 'permissioned'];

export const CONSENSUS_ALGORITHMS: string[] = [
	'poa',
	'pow',
	'raft'
];

export const GOVERNANCE_TYPES: string[] = ['decentralized', 'non-profit', 'commercial'];

export const IMMUTABILITY_TYPES: string[] = ['definitive', 'probabilistic'];

export const SMART_CONTRACT_LANGUAGES: string[] = [
	'Solidity',
	'Java',
	'JavaScript',
	'Go'
];

export const SCALABILITY_LEVELS: string[] = ['low', 'high'];

export const SUPPORTED_NETWORKS: string[] = DLT_NETWORKS;

export const SUPPORTED_PLATFORMS_FOR_STORAGE: string[] = [...ARCHITECTURE_TYPES, 'ipfs', 'local'];

export const SUPPORTED_SECOND_UNITS: string[] = ['s', 'sec', 'second', 'seconds'];
export const SUPPORTED_MINUTE_UNITS: string[] = ['min', 'minute', 'minutes'];
export const SUPPORTED_TIME_UNITS: string[] = [...SUPPORTED_SECOND_UNITS, ...SUPPORTED_MINUTE_UNITS];

export const LOW_FEES: Range = { min: 0, max: 0.5 };
export const MEDIUM_FEES: Range = { min: 0.5, max: 1 };
export const HIGH_FEES: Range = { min: 1, max: Number.MAX_SAFE_INTEGER };
export const FEES_LEVELS: Fees = { 'low': LOW_FEES, 'medium': MEDIUM_FEES, 'high': HIGH_FEES };

export const LOW_THROUGHPUT: Range = { min: 0, max: 0.5 };
export const AVERAGE_THROUGHPUT: Range = { min: 0.5, max: 1 };
export const HIGH_THROUGHPUT: Range = { min: 1, max: Number.MAX_SAFE_INTEGER };
export const THROUGHPUT_LEVELS: Fees = { 'low': LOW_THROUGHPUT, 'medium': AVERAGE_THROUGHPUT, 'high': HIGH_THROUGHPUT };