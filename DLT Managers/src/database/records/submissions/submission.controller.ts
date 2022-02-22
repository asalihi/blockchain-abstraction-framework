import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { IRecordSubmissionModel } from './submission.model';
import { SupportedRecordSubmissionModel } from './submission';
import { IRecordSubmissionSchema } from './submission.interface';
import { RecordSubmission } from '@service/database/schemata';

type RecordSubmissionQuery = Query<Nullable<IRecordSubmissionModel>, Document<IRecordSubmissionModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: RecordSubmissionQuery): Promise<SupportedRecordSubmissionModel> {
    let submission: Nullable<IRecordSubmissionModel>;
    try {
        submission = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (submission) return submission as SupportedRecordSubmissionModel;

    throw new ElementNotFoundInCollection('record submission', identifier);
}

export async function GetRecordSubmissionEntry(identifier: string, session?: ClientSession): Promise<SupportedRecordSubmissionModel> {
    const query: RecordSubmissionQuery = RecordSubmission.findOne({ identifier: identifier }).session(session ?? null);
    return await ExecuteQuery(identifier, 'fetch', query);
}

export async function RemoveRecordSubmissionEntry(identifier: string, session?: ClientSession): Promise<Nullable<SupportedRecordSubmissionModel>> {
    // TODO: Prevent use of this function, or delete it completely
    const query: RecordSubmissionQuery = RecordSubmission.findOneAndDelete({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'deletion of record submission entry', query);
}

export async function RemoveRecordSubmissionEntries(filters: FilterQuery<IRecordSubmissionModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RecordSubmission.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of record submission entries');
    }
}

export async function CountRecordSubmissions(filters?: FilterQuery<SupportedRecordSubmissionModel & Document>, session?: ClientSession): Promise<number> {
    return await RecordSubmission.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchRecordSubmissionEntries(parameters: { filters: FilterQuery<IRecordSubmissionModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IRecordSubmissionSchema, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<SupportedRecordSubmissionModel>[]> {
    let query: Query<(IRecordSubmissionModel & Document)[], IRecordSubmissionModel & Document, {}> = RecordSubmission.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec() as SupportedRecordSubmissionModel[];
}