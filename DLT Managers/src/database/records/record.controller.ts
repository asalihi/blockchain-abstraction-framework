import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { IRecordModel } from './record.model';
import { SupportedRecordModel } from './record';
import { IRecordSchema } from './record.interface';
import { Record } from '@service/database/schemata';

type RecordQuery = Query<Nullable<IRecordModel>, Document<IRecordModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: RecordQuery): Promise<SupportedRecordModel> {
    let record: Nullable<IRecordModel>;
    try {
        record = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (record) return record as SupportedRecordModel;

    throw new ElementNotFoundInCollection('record', identifier);
}

export async function GetRecordEntry(identifier: string, session?: ClientSession): Promise<SupportedRecordModel> {
    const query: RecordQuery = Record.findOne({ identifier: identifier }).session(session ?? null);
    return await ExecuteQuery(identifier, 'fetch', query);
}

export async function RemoveRecordEntry(identifier: string, session?: ClientSession): Promise<Nullable<SupportedRecordModel>> {
    // TODO: Prevent use of this function, or delete it completely
    const query: RecordQuery = Record.findOneAndDelete({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'deletion of record entry', query);
}

export async function RemoveRecordEntries(filters: FilterQuery<IRecordModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await Record.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of record entries');
    }
}

export async function CountRecords(filters?: FilterQuery<SupportedRecordModel & Document>, session?: ClientSession): Promise<number> {
    return await Record.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchRecordEntries(parameters: { filters: FilterQuery<IRecordModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IRecordSchema, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<SupportedRecordModel>[]> {
    let query: Query<(IRecordModel & Document)[], IRecordModel & Document, {}> = Record.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec() as SupportedRecordModel[];
}