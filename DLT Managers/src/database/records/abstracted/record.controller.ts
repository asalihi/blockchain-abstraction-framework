import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection, Timestamp } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IAbstractedRecordSchema } from './record.interface';
import { IAbstractedRecordModel } from './record.model';
import { AbstractedRecord, AbstractedRecordSubmission } from '@service/database/schemata';

type AbstractedRecordQuery = Query<Nullable<IAbstractedRecordModel>, IAbstractedRecordModel>;

async function ExecuteQuery(identifier: string, operation: string, query: AbstractedRecordQuery): Promise<IAbstractedRecordModel> {
    let record: Nullable<IAbstractedRecordModel>;
    try {
        record = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (record) return record;

    throw new ElementNotFoundInCollection('abstracted record', identifier);
}

export async function GetAbstractedRecordEntry(identifier: string, session?: ClientSession): Promise<IAbstractedRecordModel> {
    const query: AbstractedRecordQuery = AbstractedRecord.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateAbstractedRecordEntry(parameters: Omit<IAbstractedRecordSchema, 'context' | 'state' | 'transaction' | 'creator'>, session?: ClientSession): Promise<IAbstractedRecordModel> {
    let success: boolean = false;
    let record_entry: IAbstractedRecordModel;

    const operations = async (parameters: Omit<IAbstractedRecordSchema, 'context' | 'state' | 'transaction' | 'creator'>, session: ClientSession): Promise<void> => {
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
    else throw new QueryExecutionError('creation of abstracted record entry');
}

export async function RemoveAbstractedRecordEntry(filters: FilterQuery<IAbstractedRecordModel & Document>, session?: ClientSession): Promise<Nullable<IAbstractedRecordModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await AbstractedRecord.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of abstracted record entry');
    }
}

export async function RemoveAbstractedRecordEntries(filters: FilterQuery<IAbstractedRecordModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await AbstractedRecord.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of abstracted record entries');
    }
}

export async function CountAbstractedRecords(filters?: FilterQuery<IAbstractedRecordModel & Document>, session?: ClientSession): Promise<number> {
    return await AbstractedRecord.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchAbstractedRecords(parameters: { filters: FilterQuery<IAbstractedRecordModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IAbstractedRecordModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IAbstractedRecordModel>[]> {
    let query: Query<(IAbstractedRecordModel & Document)[], IAbstractedRecordModel & Document, {}> = AbstractedRecord.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}