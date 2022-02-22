import { Document, Query, ClientSession, FilterQuery, LeanDocument } from 'mongoose';

import { ITraceModel } from './trace.model';
import { Trace } from '@core/database/schemata';
import { SupportedTraces, SupportedTraceSchema, SupportedTraceModel, SupportedTraceModels } from './trace';
import { QueryExecutionError, ElementNotFoundInCollection } from '@core/errors/errors';
import { Nullable } from '@core/types/types';

type TraceQuery = Query<Nullable<ITraceModel>, Document<ITraceModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: TraceQuery): Promise<SupportedTraceModel> {
	let trace: Nullable<ITraceModel>;
	try {
		trace = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (trace) return trace as SupportedTraceModel;

	throw new ElementNotFoundInCollection('trace', identifier);
}

export async function GetTraceEntry(identifier: string, session?: ClientSession): Promise<SupportedTraceModel> {
	const query: TraceQuery = Trace.findOne({ identifier: identifier }).session(session ?? null);
	return await ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateTraceEntry(parameters: SupportedTraceSchema, session?: ClientSession): Promise<SupportedTraceModel> {
	try {
		if (SupportedTraces.includes(parameters['type'])) return await new SupportedTraceModels[parameters['type'] as keyof typeof SupportedTraceModels](parameters).save({ session });
		else throw new QueryExecutionError('creation of an invalid trace');
	} catch (error) {
		throw new QueryExecutionError('creation of trace entry');
	}
}

export async function RemoveTraceEntry(identifier: string, session?: ClientSession): Promise<Nullable<SupportedTraceModel>> {
	const query: TraceQuery = Trace.findOneAndDelete({ identifier: identifier }).session(session ?? null);
	return ExecuteQuery(identifier, 'deletion of trace entry', query);
}

export async function CountTraces(filters: FilterQuery<SupportedTraceModel & Document>, session?: ClientSession): Promise<number> {
	return await Trace.countDocuments(filters).session(session ?? null);
}

export async function FetchTraces(parameters: any, session?: ClientSession): Promise<(LeanDocument<SupportedTraceModel>)[]> {
	let query: Query<(ITraceModel & Document)[], ITraceModel & Document, {}> = Trace.find(parameters['filters']).skip(parameters['page'] * parameters['size']).limit(parameters['size']).session(session ?? null);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}