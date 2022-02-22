import { Document, Query, ClientSession, FilterQuery } from 'mongoose';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { Data, IDataSchema, IDataModel } from '@service/database/schemata';

type DataQuery = Query<Nullable<IDataModel>, Document<IDataModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: DataQuery): Promise<IDataModel> {
	let data: Nullable<IDataModel>;
	try {
		data = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (data) return data;

	throw new ElementNotFoundInCollection('data', identifier);
}

export async function GetDataEntry(identifier: string, session?: ClientSession): Promise<IDataModel> {
	const query: DataQuery = Data.findOne({ identifier: identifier }).session(session ?? null);
	return await ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateDataEntry(data: Object, session?: ClientSession): Promise<IDataModel> {
	try {
		return await new Data(data).save({ session });
	} catch (error) {
		throw new QueryExecutionError('creation of data');
	}
}

// TODO: Verify if removing data on custodian should be possible or not
export async function RemoveDataEntry(identifier: string, session?: ClientSession): Promise<Nullable<IDataModel>> {
	const query: DataQuery = Data.findOneAndDelete({ identifier: identifier }).session(session ?? null);
	return ExecuteQuery(identifier, 'deletion of data', query);
}

export async function CountDataEntries(filters?: FilterQuery<IDataModel & Document>): Promise<number> {
	return await Data.countDocuments(filters ?? {});
}

export async function FetchDataEntries(parameters: any, session?: ClientSession): Promise<(IDataSchema & { '_id'?: string })[]> {
	const query: Query<(IDataModel & Document)[], IDataModel & Document, {}> = Data.find(parameters['filters'] ?? {}).skip(parameters['page'] * parameters['size']).limit(parameters['size']).session(session ?? null);
	return await query.lean().exec();
}