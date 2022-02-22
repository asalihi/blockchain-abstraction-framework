import { Document, Query, FilterQuery, ClientSession } from 'mongoose';

import { Module, IModuleSchema, IModuleModel } from './module';
import { QueryExecutionError, ElementNotFoundInCollection } from '@service/utils/errors';
import { Nullable, Identifier } from '@service/utils/types';

type ModuleQuery = Query<Nullable<IModuleModel>, IModuleModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ModuleQuery): Promise<IModuleModel> {
	let module: Nullable<IModuleModel>;
	try {
		module = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (module) return module;

	throw new ElementNotFoundInCollection('module', identifier);
}

export async function GetModuleEntry(identifier: string, session?: ClientSession): Promise<IModuleModel> {
	const query: ModuleQuery = Module.findOne({ identifier: identifier }).session(session ?? null);
	return ExecuteQuery(identifier, 'fetch', query);
}

export async function RegisterModuleEntry(data: IModuleSchema, session?: ClientSession): Promise<IModuleModel> {
	try {
		const { identifier, ...attributes } = data;
		return await Module.findOneAndUpdate({ identifier: identifier }, attributes, { upsert: true, new: true });
	} catch (error) {
		throw new QueryExecutionError('registration of module entry');
    }
}

export async function CreateModuleEntry(data: IModuleSchema, session?: ClientSession): Promise<IModuleModel> {
	try {
		return await new Module(data).save({ session });
	} catch (error) {
		throw new QueryExecutionError('creation of module entry');
	}
}

export async function UpdateModuleEntry(module: Identifier, data: Partial<Omit<IModuleSchema, 'identifier'>>, session?: ClientSession): Promise<IModuleModel> {
	try {
		const query: ModuleQuery = Module.findOneAndUpdate({ identifier: module }, Object.assign(data, { 'identifier': module })).session(session ?? null);
		return ExecuteQuery(module, 'update', query);
	} catch (error) {
		throw new QueryExecutionError('update of module entry');
	}
}

export async function RemoveModuleEntry(module: string): Promise<IModuleModel> {
	let query: ModuleQuery = Module.findOneAndDelete({ identifier: module });
	return ExecuteQuery(module, 'deletion of module entry', query);
}

export async function CountModules(filters?: FilterQuery<IModuleModel & Document>): Promise<number> {
	return await Module.countDocuments(filters ?? {});
}

export async function FetchModules(parameters?: any): Promise<(IModuleSchema & { '_id'?: string })[]> {
	let query: Query<(IModuleModel & Document)[], IModuleModel & Document, {}> = Module.find(parameters?.['filters'] ?? {}).skip((parameters && parameters['page'] && parameters['size']) ? parameters['page'] * parameters['size'] : 0).limit(parameters?.['size'] ?? 0);

	if (parameters?.['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] ?? 'asc' });
	}

	return await query.lean().exec();
}