import config from 'config';
import { flatten } from 'lodash';

import { IDLTInstanceSchema } from './interfaces';
import { ARCHITECTURE_TYPES, CONSENSUS_ALGORITHMS, FEES_LEVELS, GOVERNANCE_TYPES, IMMUTABILITY_TYPES, SCALABILITY_LEVELS, SMART_CONTRACT_LANGUAGES, SUPPORTED_MINUTE_UNITS, THROUGHPUT_LEVELS } from './constants';
import { Criterion, ConsensusCriteria, ContractCriteria, DLTSelectionCriteria, CriterionName, CurrencyCriteria, DecentralizationCriteria, Distances, Fees, FeesCriteria, FinalityCriteria, GovernanceCriteria, ImmutabilityCriteria, LightnodeCriteria, ListOfCriteria, ListOfCriteriaWithScores, ListOfDelays, ListOfScores, Matrix, MaturityCriteria, PerformanceCriteria, PlatformCriteria, PlatformSelectors, PrivacyCriteria, Range, RecursivePartial, ScalabilityCriteria, Score, SecurityCriteria, SupportedConsensusAlgorithms, SupportedGovernanceTypes, SupportedImmutabilityTypes, SupportedNetworks, SupportedPlatformTypes, SupportedScalabilityLevels, SupportedSmartContractLanguages, ThroughputLevels, TokenizationCriteria, CriterionScore, WeightedMatrix, ListOfCriteriaWithWeightedScores } from './types';
import { CheckBoolean, CheckEquality, CheckInclusion, CheckRange, ReadFile } from './helpers';

function RetrieveAllInstances(): IDLTInstanceSchema[] {
	const file: Buffer = ReadFile(config.get('instances'));
	return JSON.parse(file.toString()) as IDLTInstanceSchema[];
}

function RetrieveDLTSelectionCriteria(): Partial<PlatformSelectors> & RecursivePartial<DLTSelectionCriteria> {
	const file: Buffer = ReadFile(config.get('criteria'));
	return JSON.parse(file.toString()) as Partial<PlatformSelectors> & RecursivePartial<DLTSelectionCriteria>;
}

function CheckConsensusTypes(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string>): void {
	CheckEquality(matrix, criterion_name, path_to_parameter, criteria, ARCHITECTURE_TYPES);
}

function CheckConsensusAlgorithms(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string[]>): void {
	CheckInclusion(matrix, criterion_name, path_to_parameter, criteria, CONSENSUS_ALGORITHMS);
}

function CheckSmartContractLanguages(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string[]>): void {
	CheckInclusion(matrix, criterion_name, path_to_parameter, criteria, SMART_CONTRACT_LANGUAGES);
}

function CheckGovernanceTypes(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string>): void {
	CheckEquality(matrix, criterion_name, path_to_parameter, criteria, GOVERNANCE_TYPES);
}

function CheckImmutabilityTypes(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string>): void {
	CheckEquality(matrix, criterion_name, path_to_parameter, criteria, IMMUTABILITY_TYPES);
}

function CheckPlatformTypes(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string>): void {
	CheckEquality(matrix, criterion_name, path_to_parameter, criteria, ARCHITECTURE_TYPES);
}

function CheckScalabilityLevels(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string>): void {
	CheckEquality(matrix, criterion_name, path_to_parameter, criteria, SCALABILITY_LEVELS);
}

function CheckFaultTolerance(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<number>): void {
	let ranges: ListOfCriteria<Range> = criteria.map((criterion: Criterion<number>) => { return { value: { min: 0, max: criterion['value'] }, weight: criterion['weight'] } as Criterion<Range> });
	CheckRange(matrix, criterion_name, path_to_parameter, ranges, false, { min: 0, max: 100 });
}

function CheckFeesCategory(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<keyof Fees>): void {
	let ranges: ListOfCriteria<Range> = criteria.map((criterion: Criterion<keyof Fees>) => { return { value: FEES_LEVELS[criterion['value']], weight: criterion['weight'] } as Criterion<Range> });
	CheckRange(matrix, criterion_name, path_to_parameter, ranges, true, { min: 0, max: Number.MAX_SAFE_INTEGER });
}

function CheckFinality(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, list_of_delays: ListOfDelays): void {
	let multiplier: number = (list_of_delays['unit'] && SUPPORTED_MINUTE_UNITS.includes(list_of_delays['unit'])) ? 60 : 1;
	let ranges: ListOfCriteria<Range> = list_of_delays['ranges'].map((criterion: Criterion<Range>) => { return { value: { min: (criterion['value']['min'] ?? 0) * multiplier, max: criterion['value']['max'] ? (criterion['value']['max'] * multiplier) : Number.MAX_SAFE_INTEGER }, weight: criterion['weight'] } as Criterion<Range> });
	CheckRange(matrix, criterion_name, path_to_parameter, ranges, true, { min: 0, max: Number.MAX_SAFE_INTEGER });
}

function CheckThroughputLevels(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<keyof ThroughputLevels>): void {
	let ranges: ListOfCriteria<Range> = criteria.map((criterion: Criterion<keyof Fees>) => { return { value: THROUGHPUT_LEVELS[criterion['value']], weight: criterion['weight'] } as Criterion<Range> });
	CheckRange(matrix, criterion_name, path_to_parameter, ranges);
}

function HandleConsensusCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<ConsensusCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'type': {
				CheckConsensusTypes(matrix, 'consensus type', 'profile.consensus.type', values as ListOfCriteria<SupportedPlatformTypes>);
				continue;
			}
			case 'algorithms': {
				CheckConsensusAlgorithms(matrix, 'consensus algorithms', 'profile.consensus.algorithms', values as ListOfCriteria<SupportedConsensusAlgorithms[]>);
				continue;
			}
			case 'energy-saving': {
				CheckBoolean(matrix, 'energy saving platform', 'profile.consensus.energy-saving', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleContractCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<ContractCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'support': {
				CheckBoolean(matrix, 'support of smart contracts', 'profile.contract.support', values as ListOfCriteria<Boolean>);
				continue;
			}
			case 'completeness': {
				CheckBoolean(matrix, 'completeness of smart contracts', 'profile.contract.completeness', values as ListOfCriteria<Boolean>);
				continue;
			}
			case 'languages': {
				CheckSmartContractLanguages(matrix, 'languages of smart contracts', 'profile.contract.languages', values as ListOfCriteria<SupportedSmartContractLanguages[]>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleCurrencyCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<CurrencyCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'support': {
				CheckBoolean(matrix, 'support of currency', 'profile.currency', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleDecentralizationCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<DecentralizationCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'score': {
				CheckRange(matrix, 'decentralization score', 'profile.decentralization', values as ListOfCriteria<Range>, false, { min: 0, max: 12 });
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleFeesCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<FeesCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'ranges': {
				CheckRange(matrix, 'fees ranges', 'profile.fees', values as ListOfCriteria<Range>, true, { min: 0, max: Number.MAX_SAFE_INTEGER });
				continue;
			}
			case 'category': {
				CheckFeesCategory(matrix, 'fees categories', 'profile.fees', values as ListOfCriteria<keyof Fees>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleFinalityCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<FinalityCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'delay': {
				CheckFinality(matrix, 'finality', 'profile.finality', values as ListOfDelays);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleGovernanceCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<GovernanceCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'type': {
				CheckGovernanceTypes(matrix, 'governance type', 'profile.governance.type', values as ListOfCriteria<SupportedGovernanceTypes>);
				continue;
			}
			case 'open-source': {
				CheckBoolean(matrix, 'open-source model', 'profile.governance.open-source', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleImmutabilityCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<ImmutabilityCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'type': {
				CheckImmutabilityTypes(matrix, 'immutability type', 'profile.immutability', values as ListOfCriteria<SupportedImmutabilityTypes>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleLightnodeCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<LightnodeCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'support': {
				CheckBoolean(matrix, 'support of lightnodes', 'profile.lightnode', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleMaturityCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<MaturityCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'score': {
				CheckRange(matrix, 'maturity score', 'profile.maturity', values as ListOfCriteria<Range>, false, { min: 0, max: 32 });
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandlePerformanceCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<PerformanceCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'throughput': {
				CheckRange(matrix, 'throughput', 'profile.throughput', values as ListOfCriteria<Range>, false, { min: 0, max: Number.MAX_SAFE_INTEGER });
				continue;
			}
			case 'category': {
				CheckThroughputLevels(matrix, 'throughput categories', 'profile.throughput', values as ListOfCriteria<keyof ThroughputLevels>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandlePlatformCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<PlatformCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'type': {
				CheckPlatformTypes(matrix, 'platform type', 'profile.platform', values as ListOfCriteria<SupportedPlatformTypes>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandlePrivacyCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<PrivacyCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'participants': {
				CheckBoolean(matrix, 'privacy of participants', 'profile.privacy.participants', values as ListOfCriteria<Boolean>);
				continue;
			}
			case 'transactions': {
				CheckBoolean(matrix, 'privacy of transactions', 'profile.privacy.transactions', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleScalabilityCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<ScalabilityCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'level': {
				CheckScalabilityLevels(matrix, 'scalability level', 'profile.scalability', values as ListOfCriteria<SupportedScalabilityLevels>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleSecurityCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<SecurityCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'fault-tolerance': {
				CheckFaultTolerance(matrix, 'fault tolerance', 'profile.security.fault-tolerance', values as ListOfCriteria<number>);
				continue;
			}
			case 'quantum-resistant': {
				CheckBoolean(matrix, 'quantum resistance', 'profile.security.quantum-resistant', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function HandleTokenizationCriteria(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criteria: RecursivePartial<TokenizationCriteria>): void {
	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'support': {
				CheckBoolean(matrix, 'support of tokenization', 'profile.tokenization', values as ListOfCriteria<Boolean>);
				continue;
			}
			default: throw new Error('Unsupported criterion'); // TODO: Handle error correctly
		}
	}
}

function SelectInstances(all_instances: IDLTInstanceSchema[], identifiers: string[]): IDLTInstanceSchema[] {
	let selected_instances: IDLTInstanceSchema[] = [];
	for(let identifier of [...new Set(identifiers)]) {
		selected_instances.push(...all_instances.filter((instance: IDLTInstanceSchema) => instance['identifier'] === identifier));
	}

	if(selected_instances.length === 0) throw new Error('No instances'); // TODO: Handle error correctly
	else return selected_instances;
}

function SelectNetworks(all_instances: IDLTInstanceSchema[], networks: SupportedNetworks[]): IDLTInstanceSchema[] {
	let selected_instances: IDLTInstanceSchema[] = [];
	for(let network of [...new Set(networks)]) {
		selected_instances.push(...all_instances.filter((instance: IDLTInstanceSchema) => instance['network'] === network));
	}

	if(selected_instances.length === 0) throw new Error('No networks'); // TODO: Handle error correctly
	else return selected_instances;
}

function CreateMatrix(instances: IDLTInstanceSchema[], criteria: RecursivePartial<DLTSelectionCriteria>): Matrix {
	const matrix: Matrix = new Map<IDLTInstanceSchema, ListOfCriteriaWithScores>();

	for(let instance of instances) {
		matrix.set(instance, new Map<CriterionName, ListOfScores>());
	}

	for(const [criterion, values] of Object.entries(criteria)) {
		switch(criterion) {
			case 'consensus': {
				HandleConsensusCriteria(matrix, values as RecursivePartial<ConsensusCriteria>);
				continue;
			}
			case 'contract': {
				HandleContractCriteria(matrix, values as RecursivePartial<ContractCriteria>);
				continue;
			}
			case 'currency': {
				HandleCurrencyCriteria(matrix, values as RecursivePartial<CurrencyCriteria>);
				continue;
			}
			case 'decentralization': {
				HandleDecentralizationCriteria(matrix, values as RecursivePartial<DecentralizationCriteria>);
				continue;
			}
			case 'fees': {
				HandleFeesCriteria(matrix, values as RecursivePartial<FeesCriteria>);
				continue;
			}
			case 'finality': {
				HandleFinalityCriteria(matrix, values as RecursivePartial<FinalityCriteria>);
				continue;
			}
			case 'governance': {
				HandleGovernanceCriteria(matrix, values as RecursivePartial<GovernanceCriteria>);
				continue;
			}
			case 'immutability': {
				HandleImmutabilityCriteria(matrix, values as RecursivePartial<ImmutabilityCriteria>);
				continue;
			}
			case 'lightnode': {
				HandleLightnodeCriteria(matrix, values as RecursivePartial<LightnodeCriteria>);
				continue;
			}
			case 'maturity': {
				HandleMaturityCriteria(matrix, values as RecursivePartial<MaturityCriteria>);
				continue;
			}
			case 'performance': {
				HandlePerformanceCriteria(matrix, values as RecursivePartial<PerformanceCriteria>);
				continue;
			}
			case 'platform': {
				HandlePlatformCriteria(matrix, values as RecursivePartial<PlatformCriteria>);
				continue;
			}
			case 'privacy': {
				HandlePrivacyCriteria(matrix, values as RecursivePartial<PrivacyCriteria>);
				continue;
			}
			case 'scalability': {
				HandleScalabilityCriteria(matrix, values as RecursivePartial<ScalabilityCriteria>);
				continue;
			}
			case 'security': {
				HandleSecurityCriteria(matrix, values as RecursivePartial<SecurityCriteria>);
				continue;
			}
			case 'tokenization': {
				HandleTokenizationCriteria(matrix, values as RecursivePartial<TokenizationCriteria>);
				continue;
			}
			default: continue;
		}
	}
	return matrix;
}

function CreateWeightedNormalizedMatrix(matrix: Matrix): WeightedMatrix {
	const weighted_matrix: WeightedMatrix = new Map();
	const all_scores: CriterionScore[] = flatten<CriterionScore>(Array.from(Array.from(matrix.values()).pop().values()));
	const all_weights: number = all_scores.reduce<number>((total: number, criterion: CriterionScore) => total + criterion['weight'], 0);

	for(const [instance, criteria] of matrix.entries()) {
		weighted_matrix.set(instance, new Map());
		
		for(let [criterion, values] of criteria.entries()) {
			const weighted_values: number[] = [];

			for(let [index, score] of values.entries()) {
				const weight: number = score['weight']/all_weights;
				weighted_values.push(score['value'] * weight);
			}

			weighted_matrix.get(instance).set(criterion, weighted_values);
		}
	}

	return weighted_matrix;
}

function CalculateDistances(matrix: WeightedMatrix): Map<IDLTInstanceSchema, Distances> {
	const all_distances: Map<IDLTInstanceSchema, Distances> = new Map();

	for(const [instance, criteria] of matrix.entries()) {
		let positive_distance: number = 0;
		let negative_distance: number = 0;

		for(const [criterion, values] of criteria.entries()) {
			for(const [index, value] of values.entries()) {
				const values_of_all_instances:number[] = [...matrix.values()].map((all_criteria: ListOfCriteriaWithWeightedScores) => all_criteria.get(criterion)[index]);
				const best: number = Math.max(...values_of_all_instances);
				const worse: number = Math.min(...values_of_all_instances);
				positive_distance += Math.pow(value - best, 2);
				negative_distance += Math.pow(value - worse, 2);
			}
		}

		all_distances.set(instance, { 'positive_distance': Math.sqrt(positive_distance), 'negative_distance': Math.sqrt(negative_distance) });
	}

	return all_distances;
}

function CalculateScores(all_distances: Map<IDLTInstanceSchema, Distances>): Map<IDLTInstanceSchema, Score> {
	const all_scores: Map<IDLTInstanceSchema, Score> = new Map();

	for(let [instance, distances] of all_distances.entries()) {
		all_scores.set(instance, ((distances['positive_distance'] === 0) && (distances['negative_distance'] === 0)) ? 0 : distances['negative_distance']/(distances['positive_distance']+distances['negative_distance']));
	}

	return all_scores;
}

export function SelectInstance(): void {
	const all_instances: IDLTInstanceSchema[] = RetrieveAllInstances();
	const criteria: Partial<PlatformSelectors> & RecursivePartial<DLTSelectionCriteria> = RetrieveDLTSelectionCriteria();

	const selected_instances: IDLTInstanceSchema[] = [];
	if(criteria['instances']) selected_instances.push(...SelectInstances(all_instances, criteria['instances']));
	if(criteria['networks']) selected_instances.push(...new Set(SelectNetworks(all_instances, criteria['networks'])));
	
	const matrix: Matrix = CreateMatrix(selected_instances.length > 0 ? selected_instances : all_instances, criteria);
	
	if(matrix.size === 0) {
		console.log('No candidate found');
	} else if(matrix.size === 1) {
		console.log('Only one candidate found: ' + Array.from(matrix.keys()).pop()['identifier']);
	} else {
		const weighted_matrix: WeightedMatrix = CreateWeightedNormalizedMatrix(matrix);
		const all_distances: Map<IDLTInstanceSchema, Distances> = CalculateDistances(weighted_matrix);
		const final_scores: Map<IDLTInstanceSchema, Score> = CalculateScores(all_distances);

		for(const [i, s] of final_scores.entries()) {
			console.log('**********');
			console.log('Instance: ' + i['identifier']);
			console.log('Score: ' + s);
		}
	}
}