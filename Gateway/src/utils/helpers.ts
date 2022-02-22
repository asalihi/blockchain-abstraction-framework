import { AxiosResponse } from 'axios';
import compare from 'date-fns/compareAsc';
import format from 'date-fns/format';
import difference from 'date-fns/differenceInSeconds';
import add from 'date-fns/addSeconds';
import fs from 'fs';
import { omitBy as omit_by, isNil as is_nil } from 'lodash';
import path from 'path';

import { PROXY } from '@service/server/proxy';
import { DURATION_REGEX, MINUTE, HOUR, DAY, WEEK, YEAR, SECOND_UNITS, MINUTE_UNITS, HOUR_UNITS, DAY_UNITS, WEEK_UNITS } from '@service/utils/constants';
import { InvalidDuration, DateManipulationError, ConversionError, DirectoryCreationError, ReadFileError, WriteFileError, HTTPRequestError } from '@service/utils/errors';
import { Nullable, HTTPEndpoint, HTTPMethod, HTTPHeaders, HTTPParameters } from '@service/utils/types';

// TODO: Check if all functions are used

export async function Sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ReadFile(location: string): Buffer {
	try {
		return fs.readFileSync(location);
	} catch {
		throw new ReadFileError(location);
	}
}

export function WriteFile(file: { location: string, name?: string }, data: any): void {
	if (!fs.existsSync(file['location'])) {
		try {
			fs.mkdirSync(file['location'], { recursive: true });
		} catch {
			throw new DirectoryCreationError(file['location']);
		}
	}

	const full_path: string = file['name'] ? path.join(file['location'], file['name']) : file['location'];
	try {
		fs.writeFileSync(full_path, data);
	} catch {
		throw new WriteFileError(full_path);
	}
}

export async function ExecuteHTTPRequest(endpoint: HTTPEndpoint, method: HTTPMethod, content?: { headers?: HTTPHeaders, parameters?: HTTPParameters }): Promise<AxiosResponse> {
	try {
		return await PROXY.request({ method: method, url: endpoint, ...(content?.['headers'] && { headers: content['headers'] }), ...(content?.['parameters'] && { data: content['parameters'] }) });
	} catch (error) {
		if (error.response) return error.response;
		else throw new HTTPRequestError(endpoint, method, error);
	}
}

// Helper adapted from: https://github.com/panva/jose/blob/0356a468a100a06e4d47c62bc71985a81090aac1/lib/help/secs.js
export function GetNumberOfSeconds(duration: string): number {
	const result = DURATION_REGEX.exec(duration);

	if (!result) {
		throw new InvalidDuration(duration);
	}

	const value: number = Number(result.groups!.value);
	const unit: string = result.groups!.unit.toLowerCase();

	try {
		if (SECOND_UNITS.includes(unit)) return Math.round(value);
		else if (MINUTE_UNITS.includes(unit)) return Math.round(value * MINUTE);
		else if (HOUR_UNITS.includes(unit)) return Math.round(value * HOUR);
		else if (DAY_UNITS.includes(unit)) return Math.round(value * DAY);
		else if (WEEK_UNITS.includes(unit)) return Math.round(value * WEEK);
		else return Math.round(value * YEAR);
	} catch {
		throw new ConversionError(duration, 'seconds');
	}
}

export function ConvertDate(date: Date | number, pattern: string = 'ddMMyyy'): string {
	try {
		return format(date, pattern);
	} catch {
		throw new ConversionError(date.toString(), `date (${pattern})`);
	}
}

export function GetCurrentDateInSeconds(): number {
	return GetDateInSeconds(new Date());
}

export function GetDateInSeconds(date: Date): number {
	try {
		return Number(format(date, 't'));
	} catch {
		throw new ConversionError(date.toString(), 'date (timestamp in seconds)');
	}
}

export function GetCurrentDay(pattern: string = 'ddMMyyyy'): string {
	let now: number = Date.now();
	try {
		return format(now, pattern);
	} catch {
		throw new ConversionError(now.toString(), `date (${pattern})`);
	}
}

export function CompareDates(first: number | Date, second: number | Date): number {
	return compare(first, second);
}

export function GetElapsedSecondsBetweenDates(from: number | Date, to: number | Date): number {
	try {
		return difference(to, from);
	} catch {
		throw new ConversionError(`${from.toString()} and ${to.toString()}`, 'elapsed seconds');
	}
}

export function AddSecondsToCurrentDate(seconds: number): Date {
	return AddSecondsToDate(new Date(), seconds);
}

export function AddSecondsToDate(date: Date, seconds: number): Date {
	try {
		return add(date, seconds);
	} catch {
		throw new DateManipulationError('add seconds');
	}
}

// This function does not support complex objects where a custom function is needed to perform the sort
export function Sort(object: { [key: string]: any }): Object {
	return Object.keys(omit_by(object, is_nil)).sort().reduce((accumulator: Object, key: string) => {
		if (object[key]) {
			let element: any = (typeof object[key] == 'object') ? ((object[key] instanceof Array) ? [...object[key]].sort() : Sort(object[key])) : object[key];
			return { ...accumulator, [key]: element };
		} else {
			return { ...accumulator };
		}
	}, {});
}

export function CapitalizeFirstLetterOnly(s: string): string {
	return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function ReplaceSpaces(s: string, substitution: string = '-'): string {
	return s.replace(/ /g, substitution);
}

export function ReplaceSpacesAndCapitalizeFirstLetterOnly(s: string): string {
	return CapitalizeFirstLetterOnly(ReplaceSpaces(s, ''));
}

export function ReplaceSpacesAndRemoveUppercases(s: string): string {
	return ReplaceSpaces(s.toLowerCase());
}

export function ConvertArrayToObject(array: Array<any>, key: string): { [key: string]: any } {
	return array.reduce((object, item) => { let { [key]: id, ...properties } = item; return Object.assign({}, { ...object, [id]: properties }); }, {});
}

export function ConvertObjectToArray(object: { [key: string]: any }, key_name: string, additional_properties?: { [key: string]: any }): Array<{ [key: string]: any }> {
	return Object.keys(object).map((key: string) => Object.assign({ [key_name]: key }, object[key], additional_properties));
}

export function RemoveKeys(object: { [key: string]: any }, keys: string[]): { [key: string]: any } {
	return { ...Object.keys(object).filter((key: string) => !keys.includes(key)).reduce((object_to_return: { [key: string]: any }, key: string) => { return { ...object_to_return, [key]: object[key] } }, {}) };
}

export function KeepKeys(object: { [key: string]: any }, keys: string[]): { [key: string]: any } {
	return { ...Object.keys(object).filter((key: string) => keys.includes(key)).reduce((object_to_return: { [key: string]: any }, key: string) => { return { ...object_to_return, [key]: object[key] } }, {}) };
}

export function GetEnumKeyOfValue<T extends { [index: string]: string }>(enumerator: T, value: string): Nullable<keyof T> {
	let keys = Object.keys(enumerator).filter(x => enumerator[x] == value);
	return keys.length > 0 ? keys.pop()! : null;
}