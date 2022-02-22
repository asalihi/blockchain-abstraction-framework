import { Document, Query, FilterQuery, SaveOptions, QueryOptions } from 'mongoose';

import { User, IUserSchema, IUserModel } from './user';
import { QueryExecutionError, ElementNotFoundInCollection } from '@service/utils/errors';
import { Nullable } from '@service/utils/types';

type UserQuery = Query<Nullable<IUserModel>, IUserModel>;

async function ExecuteQuery(identifier: string, operation: string, query: UserQuery): Promise<IUserModel> {
	let user: Nullable<IUserModel>;
	try {
		user = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (user) return user;

	throw new ElementNotFoundInCollection('user', identifier);
}

export async function GetUserEntry(username: string): Promise<IUserModel> {
	const query: UserQuery = User.findOne({ username: username });
	return ExecuteQuery(username, 'fetch', query);
}

export async function CreateUserEntry(context: { options?: Partial<SaveOptions>, data: Omit<IUserSchema, 'password'> & { 'password': string } }): Promise<IUserModel> {
	try {
		return await new User(Object.assign(context['data'], { password: { value: context['data']['password'], salt: '0x0' } }) as IUserSchema).save(context['options']);
	} catch (error) {
		throw new QueryExecutionError('creation of user entry');
	}
}

export async function UpdateUserEntry(context: { options?: Partial<QueryOptions>, username: string, data: Partial<Omit<IUserSchema, 'password'> & { 'password': string }> }): Promise<IUserModel> {
	try {
		const query: UserQuery = User.findOneAndUpdate({ username: context['username'] }, Object.assign(context['data'], { password: { value: context['data']['password'], salt: '0x0' }}) as Partial<IUserSchema>, Object.assign({ new: true }, context['options']));
		return ExecuteQuery(context['username'], 'fetch', query);
	} catch (error) {
		throw new QueryExecutionError('update of user entry');
	}
}

export async function RemoveUserEntry(username: string): Promise<IUserModel> {
	let query: UserQuery = User.findOneAndDelete({ username: username });
	return ExecuteQuery(username, 'deletion of user entry', query);
}

export async function CountUsers(filters?: FilterQuery<IUserModel & Document>): Promise<number> {
	return await User.countDocuments(filters ?? {});
}

export async function FetchUsers(parameters: any): Promise<(IUserSchema & { '_id'?: string })[]> {
	let query: Query<(IUserModel & Document)[], IUserModel & Document, {}> = User.find(parameters['filters']).skip(parameters['page'] * parameters['size']).limit(parameters['size']);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}