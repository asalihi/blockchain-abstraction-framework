import { readFileSync } from 'fs';
import { get } from 'lodash';

import { ListOfCriteria, Range } from './types';
import { IDLTInstanceSchema } from './interfaces';

export function ReadFile(location: string): Buffer {
	try {
		return readFileSync(location);
	} catch {
		throw new Error(`Could not read the file: ${location}`);
	}
}

export function CheckBoolean(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<Boolean|string>): void {
	CheckEquality(matrix, criterion_name, path_to_parameter, criteria, [true, false]);
}

export function CheckEquality(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<Boolean|string>, accepted_values?: any[]): void {
	instance_loop:
	for(const [instance, values] of matrix.entries()) {
		let all_values: {value: number, weight: number}[] = [];
		for(const criterion of criteria) {
			if(accepted_values && !accepted_values.includes(criterion['value'])) continue;

			let match: Boolean = get(instance, path_to_parameter) === criterion['value'];
			let criterion_is_required: Boolean = (criterion['weight'] === 'REQUIRED') || (criterion['weight'] === 5);
			let criterion_is_undesirable: Boolean = (criterion['weight'] === 'UNDESIRABLE') || (criterion['weight'] === 0);
			if(criterion_is_required || criterion_is_undesirable) {
				if((criterion_is_required && !match) || (criterion_is_undesirable && match)) {
					matrix.delete(instance);
					continue instance_loop;
				}
			} else all_values.push({ value: match ? 1 : 0, weight: criterion['weight'] as number});
		}
		values.set(criterion_name, all_values);
	}
}

export function CheckInclusion(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<string[]>, accepted_values?: string[]): void {
	instance_loop:
	for(const [instance, values] of matrix.entries()) {
		let all_values: {value: number, weight: number}[] = [];
		for(const criterion of criteria) {
			// We consider that if at least one provided value is valid, then algorithm applies (vs. 'every' which requires that all values are valid)
			if(accepted_values && !(criterion['value'].some((v: any) => accepted_values.includes(v)))) continue;
			
			let match: Boolean = (criterion['value'].some((v: any) => get(instance, path_to_parameter).includes(v)));
			let criterion_is_required: Boolean = (criterion['weight'] === 'REQUIRED') || (criterion['weight'] === 5);
			let criterion_is_undesirable: Boolean = (criterion['weight'] === 'UNDESIRABLE') || (criterion['weight'] === 0);
			if(criterion_is_required || criterion_is_undesirable) {
				if((criterion_is_required && !match) || (criterion_is_undesirable && match)) {
					matrix.delete(instance);
					continue instance_loop;
				}
			} else all_values.push({ value: match ? 1 : 0, weight: criterion['weight'] as number });
		}
		values.set(criterion_name, all_values);
	}
}

export function CheckInclusionInRange(value: number, range: Range, accepted_values?: Range): Boolean {
	return (range['min'] ? value >= range['min'] : (value >= (accepted_values?.['min'] ?? 0))) && (range['max'] ? value <= range['max'] : (value <= (accepted_values?.['max'] ?? Number.MAX_SAFE_INTEGER)));
}

export function CheckRange(matrix: Map<IDLTInstanceSchema, Map<string, {value: number, weight: number}[]>>, criterion_name: string, path_to_parameter: string, criteria: ListOfCriteria<Range>, invert_order: Boolean = false, accepted_values?: Range): void {
	instance_loop:
	for(const [instance, values] of matrix.entries()) {
		let all_values: {value: number, weight: number}[] = [];
		for(const criterion of criteria) {
			if(accepted_values && ((criterion['value']['min'] < accepted_values['min']) || (criterion['value']['max'] > accepted_values['max']))) continue;

			let value_for_instance: number = get(instance, path_to_parameter);
			let match: Boolean = CheckInclusionInRange(value_for_instance, criterion['value'], accepted_values);
			let criterion_is_required: Boolean = (criterion['weight'] === 'REQUIRED') || (criterion['weight'] === 5);
			let criterion_is_undesirable: Boolean = (criterion['weight'] === 'UNDESIRABLE') || (criterion['weight'] === 0);
			if(criterion_is_required || criterion_is_undesirable) {
				if((criterion_is_required && !match) || (criterion_is_undesirable && match)) {
					matrix.delete(instance);
					continue instance_loop;
				}
			} else {
				if(match) {
					let min: number = [...matrix.keys()].map((i: IDLTInstanceSchema) => get(i, path_to_parameter)).reduce((min: number, n: number) => n < min ? n : min);
					let parameters_of_all_instances: number[] = [...matrix.keys()].filter((i: IDLTInstanceSchema) => CheckInclusionInRange(get(i, path_to_parameter), criterion['value'], accepted_values)).map((i: IDLTInstanceSchema) => get(i, path_to_parameter));
					let local_min: number = parameters_of_all_instances.reduce((min: number, n: number) => n < min ? n : min);
					let local_max: number = parameters_of_all_instances.reduce((max: number, n: number) => n > max ? n : max);
					all_values.push({ value: (local_max - min === 0) ? 0 : ((((invert_order ? (local_max + local_min - value_for_instance) : value_for_instance) - min)) / (local_max - min)), weight: criterion['weight'] as number });
				} else {
					all_values.push({ value: 0, weight: criterion['weight'] as number });
				}
				
			}
		}
		values.set(criterion_name, all_values);
	}
}