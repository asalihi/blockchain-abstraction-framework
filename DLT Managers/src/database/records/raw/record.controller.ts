import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection, Timestamp } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IRawRecordSchema } from './record.interface';
import { IRawRecordModel } from './record.model';
import { RawRecord, RawRecordSubmission } from '@service/database/schemata';

type AbstractedRecordQuery = Query<Nullable<IRawRecordModel>, IRawRecordModel>;

async function ExecuteQuery(identifier: string, operation: string, query: AbstractedRecordQuery): Promise<IRawRecordModel> {
    let record: Nullable<IRawRecordModel>;
    try {
        record = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (record) return record;

    throw new ElementNotFoundInCollection('abstracted record', identifier);
}

export async function GetRawRecordEntry(identifier: string, session?: ClientSession): Promise<IRawRecordModel> {
    const query: AbstractedRecordQuery = RawRecord.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateRawRecordEntry(parameters: Omit<IRawRecordSchema, 'context' | 'transaction'>, session?: ClientSession): Promise<IRawRecordModel> {
    let success: boolean = false;
    let record_entry: IRawRecordModel;

    const operations = async (parameters: Omit<IRawRecordSchema, 'context' | 'transaction'>, session: ClientSession): Promise<void> => {
        if(true) {
            success = true;
        } else throw new QueryExecutionError('creation of an invalid record');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return record_entry!;
    else throw new QueryExecutionError('creation of raw record entry');
}

export async function RemoveRawRecordEntry(filters: FilterQuery<IRawRecordModel & Document>, session?: ClientSession): Promise<Nullable<IRawRecordModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RawRecord.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of raw record entry');
    }
}

export async function RemoveRawRecordEntries(filters: FilterQuery<IRawRecordModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RawRecord.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of raw record entries');
    }
}

export async function CountRawRecords(filters?: FilterQuery<IRawRecordModel & Document>, session?: ClientSession): Promise<number> {
    return await RawRecord.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchRawRecords(parameters: { filters: FilterQuery<IRawRecordModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IRawRecordModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IRawRecordModel>[]> {
    let query: Query<(IRawRecordModel & Document)[], IRawRecordModel & Document, {}> = RawRecord.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}