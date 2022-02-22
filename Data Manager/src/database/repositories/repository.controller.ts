import { Document, Query, ClientSession, FilterQuery } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Nullable, Identifier, QueryExecutionError, ElementNotFoundInCollection, RepositoryState, Repository as RepositoryObject } from 'core';
import { Repository, IRepositorySchema, IRepositoryModel } from '@service/database/schemata';

type RepositoryQuery = Query<Nullable<IRepositoryModel>, Document<IRepositoryModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: RepositoryQuery): Promise<IRepositoryModel> {
	let repository: Nullable<IRepositoryModel>;
	try {
		repository = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (repository) return repository;

	throw new ElementNotFoundInCollection('repository', identifier);
}

export async function GetRepositoryEntry(identifier: Identifier, session?: ClientSession): Promise<IRepositoryModel> {
	const query: RepositoryQuery = Repository.findOne({ identifier: identifier }).session(session ?? null);
	return await ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateRepositoryEntry(data: Omit<RepositoryObject, 'identifier' | 'creation' | 'state' | 'entries'> & { 'identifier'?: string }, session?: ClientSession): Promise<IRepositoryModel> {
	try {
		return await new Repository(Object.assign({ 'identifier': uuidv4() }, data, { 'creation': Date.now(), 'state': 'active', 'entries': [] })).save({ session });
	} catch (error) {
		throw new QueryExecutionError('creation of repository');
	}
}

export async function CountRepositories(filters?: FilterQuery<IRepositoryModel & Document>): Promise<number> {
	return await Repository.countDocuments(filters ?? {});
}

export async function FetchRepositories(parameters: any, session?: ClientSession): Promise<(IRepositorySchema & { '_id'?: string })[]> {
	let query: Query<(IRepositoryModel & Document)[], IRepositoryModel & Document, {}> = Repository.find(parameters['filters'] ?? {}).skip(parameters['page'] * parameters['size']).limit(parameters['size']).session(session ?? null);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}

export async function AddEntryToRepository(repository: Identifier, entry: Identifier, session?: ClientSession): Promise<IRepositoryModel> {
	const repository_entry: IRepositoryModel = await GetRepositoryEntry(repository, session);
	if (repository_entry.get('state') === 'active') {
		return Repository.findByIdAndUpdate(repository_entry.get('_id'), { $push: { 'entries': entry } }, { upsert: true, new: true, session });
	} else {
		throw new Error(`Cannot add a new entry to a deactivated repository`); // TODO: Handle error
	}
}

export async function ActivateRepository(repository: Identifier, session?: ClientSession): Promise<IRepositoryModel> {
	return ChangeStateOfRepository(repository, 'active', session);
}

export async function DeactivateRepository(repository: Identifier, session?: ClientSession): Promise<IRepositoryModel> {
	return ChangeStateOfRepository(repository, 'deactivated', session);
}

async function ChangeStateOfRepository(repository: Identifier, new_state: RepositoryState, session?: ClientSession): Promise<IRepositoryModel> {
	const repository_entry: IRepositoryModel = await GetRepositoryEntry(repository, session);
	if (repository_entry.get('state') !== new_state) {
		const query: RepositoryQuery = Repository.findOneAndUpdate({ identifier: repository }, { 'state': new_state }).session(session ?? null);
		return await ExecuteQuery(repository, (new_state === 'active') ? 'activating repository' : 'deactivating repository', query);
	} else {
		throw new Error(`Repository is already ${(repository_entry.get('state') === 'active') ? 'active' : 'deactivated'}`); // TODO: Handle error
	}
}