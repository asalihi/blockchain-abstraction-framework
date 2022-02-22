import { Document, Query, ClientSession, FilterQuery } from 'mongoose';
import { OpenAPIV3 } from 'openapi-types';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { ICustodianSchema } from './custodian.interface';
import { ICustodianModel } from './custodian.model';
import { Custodian } from '@service/database/schemata';

type CustodianQuery = Query<Nullable<ICustodianModel>, Document<ICustodianModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: CustodianQuery): Promise<ICustodianModel> {
	let custodian: Nullable<ICustodianModel>;
	try {
		custodian = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (custodian) return custodian;

	throw new ElementNotFoundInCollection('custodian', identifier);
}

export async function GetCustodianEntry(identifier: string, session?: ClientSession): Promise<ICustodianModel> {
	const query: CustodianQuery = Custodian.findOne({ identifier: identifier }).session(session ?? null);
	return await ExecuteQuery(identifier, 'fetch', query);
}

export async function RegisterCustodianEntry(data: Omit<ICustodianSchema, 'registration' | 'server'> & { 'server': OpenAPIV3.Document }, session?: ClientSession): Promise<ICustodianModel> {
	try {
		const { identifier, ...attributes } = data;
		const query: CustodianQuery = Custodian.findOneAndUpdate({ identifier: identifier }, Object.assign(attributes, { 'registration': Date.now(), 'server': JSON.stringify(attributes['server']) }), { upsert: true, new: true });
		return await ExecuteQuery(identifier, 'registration', query);
	} catch (error) {
		throw new QueryExecutionError('registration of custodian entry');
	}
}

export async function CreateCustodianEntry(parameters: Omit<ICustodianSchema, 'registration' | 'server'> & { 'server': OpenAPIV3.Document }, session?: ClientSession): Promise<ICustodianModel> {
	try {
		return await new Custodian(Object.assign(parameters, { 'registration': Date.now(), 'server': JSON.stringify(parameters['server']) })).save({ session });
	} catch (error) {
		throw new QueryExecutionError('creation of custodian');
	}
}

export async function CountCustodians(filters?: FilterQuery<ICustodianModel & Document>): Promise<number> {
	return await Custodian.countDocuments(filters ?? {});
}

export async function FetchCustodians(parameters: any, session?: ClientSession): Promise<(ICustodianSchema & { '_id'?: string })[]> {
	let query: Query<(ICustodianModel & Document)[], ICustodianModel & Document, {}> = Custodian.find(parameters['filters'] ?? {}).skip(parameters['page'] * parameters['size']).limit(parameters['size']).session(session ?? null);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}