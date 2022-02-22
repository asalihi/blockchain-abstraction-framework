import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { ITrackAndTraceTraceModel } from './trace.model';
import { SupportedTrackAndTraceTraceModel } from './trace';
import { TrackAndTraceTrace } from '@service/database/schemata';
import { ITrackAndTraceTraceSchema } from './trace.interface';

type TrackAndTraceTraceQuery = Query<Nullable<ITrackAndTraceTraceModel>, Document<ITrackAndTraceTraceModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: TrackAndTraceTraceQuery): Promise<SupportedTrackAndTraceTraceModel> {
    let trace: Nullable<ITrackAndTraceTraceModel>;
    try {
        trace = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (trace) return trace as SupportedTrackAndTraceTraceModel;

    throw new ElementNotFoundInCollection('T&T trace', identifier);
}

export async function GetTrackAndTraceTraceEntry(identifier: string, session?: ClientSession): Promise<SupportedTrackAndTraceTraceModel> {
    const query: TrackAndTraceTraceQuery = TrackAndTraceTrace.findOne({ identifier: identifier }).session(session ?? null);
    return await ExecuteQuery(identifier, 'fetch', query);
}

export async function RemoveTrackAndTraceTraceEntry(identifier: string, session?: ClientSession): Promise<Nullable<SupportedTrackAndTraceTraceModel>> {
    // TODO: Prevent use of this function, or delete it completely
    const query: TrackAndTraceTraceQuery = TrackAndTraceTrace.findOneAndDelete({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'deletion of T&T trace entry', query);
}

export async function RemoveTrackAndTraceTraceEntries(filters: FilterQuery<ITrackAndTraceTraceModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await TrackAndTraceTrace.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of T&T trace entry');
    }
}

export async function CountTrackAndTraceTraces(filters?: FilterQuery<SupportedTrackAndTraceTraceModel & Document>, session?: ClientSession): Promise<number> {
    return await TrackAndTraceTrace.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchTrackAndTraceTraceEntries(parameters: { filters: FilterQuery<ITrackAndTraceTraceModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof Omit<ITrackAndTraceTraceSchema, 'signature' | 'reference'>, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<SupportedTrackAndTraceTraceModel>[]> {
    let query: Query<(ITrackAndTraceTraceModel & Document)[], ITrackAndTraceTraceModel & Document, {}> = TrackAndTraceTrace.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec() as SupportedTrackAndTraceTraceModel[];
}