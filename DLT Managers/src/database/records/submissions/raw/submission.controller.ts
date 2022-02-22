import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection, Timestamp } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IRawRecordSubmissionSchema } from './submission.interface';
import { IRawRecordSubmissionModel } from './submission.model';
import { RawRecordSubmission } from '@service/database/schemata';

type RawRecordSubmissionQuery = Query<Nullable<IRawRecordSubmissionModel>, IRawRecordSubmissionModel>;

async function ExecuteQuery(identifier: string, operation: string, query: RawRecordSubmissionQuery): Promise<IRawRecordSubmissionModel> {
    let submission: Nullable<IRawRecordSubmissionModel>;
    try {
        submission = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (submission) return submission;

    throw new ElementNotFoundInCollection('raw record submission', identifier);
}

export async function GetRawRecordSubmissionEntry(identifier: string, session?: ClientSession): Promise<IRawRecordSubmissionModel> {
    const query: RawRecordSubmissionQuery = RawRecordSubmission.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateRawRecordSubmissionEntry(parameters: Omit<IRawRecordSubmissionSchema, 'registration' | 'state'>, session?: ClientSession): Promise<IRawRecordSubmissionModel> {
    let success: boolean = false;
    let submission_entry: IRawRecordSubmissionModel;

    const operations = async (parameters: Omit<IRawRecordSubmissionSchema, 'registration' | 'state'>, session: ClientSession): Promise<void> => {
        if(true) {
            success = true;
        } else throw new QueryExecutionError('creation of an invalid raw record submission');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return submission_entry!;
    else throw new QueryExecutionError('creation of raw record submission entry');
}

export async function RemoveRawRecordSubmissionEntry(filters: FilterQuery<IRawRecordSubmissionModel & Document>, session?: ClientSession): Promise<Nullable<IRawRecordSubmissionModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RawRecordSubmission.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of raw record submission entry');
    }
}

export async function RemoveRawRecordSubmissionEntries(filters: FilterQuery<IRawRecordSubmissionModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RawRecordSubmission.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of raw record submission entries');
    }
}

export async function CountRawRecordSubmissions(filters?: FilterQuery<IRawRecordSubmissionModel & Document>, session?: ClientSession): Promise<number> {
    return await RawRecordSubmission.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchRawRecordSubmissions(parameters: { filters: FilterQuery<IRawRecordSubmissionModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IRawRecordSubmissionModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IRawRecordSubmissionModel>[]> {
    let query: Query<(IRawRecordSubmissionModel & Document)[], IRawRecordSubmissionModel & Document, {}> = RawRecordSubmission.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}