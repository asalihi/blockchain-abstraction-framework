import config from 'config';
import { Document, Query, FilterQuery, SaveOptions, QueryOptions } from 'mongoose';

import { APISession, IAPISessionSchema, IAPISessionModel } from './session';
import { GenerateUniqueIdentifier, HashInput } from '@service/crypto/helpers';
import { GetDateInSeconds } from '@service/utils/helpers';
import { QueryExecutionError, ElementNotFoundInCollection } from '@service/utils/errors';
import { Nullable, StoredToken } from '@service/utils/types';

type APISessionQuery = Query<Nullable<IAPISessionModel>, IAPISessionModel>;

async function ExecuteQuery(identifier: string, operation: string, query: APISessionQuery): Promise<IAPISessionModel> {
	let session: Nullable<IAPISessionModel>;
	try {
		session = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (session) return session;

	throw new ElementNotFoundInCollection('session', identifier);
}

export async function GetAPISessionEntry(username: string): Promise<IAPISessionModel> {
	const query: APISessionQuery = APISession.findOne({ username: username });
	return ExecuteQuery(username, 'fetch', query);
}

export async function CreateAPISessionEntry(context: { options?: Partial<SaveOptions | QueryOptions>, username: string }): Promise<IAPISessionModel> {
	const time: number = GetDateInSeconds(new Date());
	const api_session_data: Omit<IAPISessionSchema, 'username'> = { identifier: GenerateUniqueIdentifier(), last_used_token: Object.assign({ jti: config.get('crypto.jwt.genesis') }, HashInput(config.get('crypto.jwt.genesis'), 2)) as StoredToken, login: time };
	try {
		if (await APISession.findOne({ username: context['username'] })) return UpdateAPISessionEntry({ options: context['options'] as QueryOptions, username: context['username'], data: api_session_data });
		else return await new APISession(Object.assign({ username: context['username'] }, api_session_data)).save(context['options']);
	} catch (error) {
		throw new QueryExecutionError('creation of api session entry');
	}
}

export async function UpdateAPISessionEntry(context: { options?: Partial<QueryOptions>, username: string, data: Partial<Omit<IAPISessionSchema, 'username'>> }): Promise<IAPISessionModel> {
	try {
		const query: APISessionQuery = APISession.findOneAndUpdate({ username: context['username'] }, context['data'], Object.assign({ new: true }, context['options']));
		return ExecuteQuery(context['username'], 'fetch', query);
	} catch (error) {
		throw new QueryExecutionError('update of api session entry');
	}
}

export async function RemoveAPISessionEntry(username: string): Promise<IAPISessionModel> {
	const query: APISessionQuery = APISession.findOneAndDelete({ username: username });
	return ExecuteQuery(username, 'deletion of api session entry', query);
}

export async function CountAPISessions(filters?: FilterQuery<IAPISessionModel & Document>): Promise<number> {
	return await APISession.countDocuments(filters ?? {});
}

export async function FetchAPISessions(parameters: any): Promise<(IAPISessionSchema & { '_id'?: string })[]> {
	let query: Query<(IAPISessionModel & Document)[], IAPISessionModel & Document, {}> = APISession.find(parameters['filters']).skip(parameters['page'] * parameters['size']).limit(parameters['size']);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}