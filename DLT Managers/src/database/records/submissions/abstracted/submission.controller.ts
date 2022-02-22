import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection, Timestamp } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IAbstractedRecordSubmissionSchema } from './submission.interface';
import { IAbstractedRecordSubmissionModel } from './submission.model';
import { AbstractedRecordSubmission } from '@service/database/schemata';

type AbstractedRecordSubmissionQuery = Query<Nullable<IAbstractedRecordSubmissionModel>, IAbstractedRecordSubmissionModel>;

async function ExecuteQuery(identifier: string, operation: string, query: AbstractedRecordSubmissionQuery): Promise<IAbstractedRecordSubmissionModel> {
    let submission: Nullable<IAbstractedRecordSubmissionModel>;
    try {
        submission = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (submission) return submission;

    throw new ElementNotFoundInCollection('abstracted record submission', identifier);
}

export async function GetAbstractedRecordSubmissionEntry(identifier: string, session?: ClientSession): Promise<IAbstractedRecordSubmissionModel> {
    const query: AbstractedRecordSubmissionQuery = AbstractedRecordSubmission.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateAbstractedRecordSubmissionEntry(parameters: Omit<IAbstractedRecordSubmissionSchema, 'registration' | 'state'>, session?: ClientSession): Promise<IAbstractedRecordSubmissionModel> {
    let success: boolean = false;
    let submission_entry: IAbstractedRecordSubmissionModel;

    const operations = async (parameters: Omit<IAbstractedRecordSubmissionSchema, 'registration' | 'state'>, session: ClientSession): Promise<void> => {
        if(true) {
            success = true;
        } else throw new QueryExecutionError('creation of an invalid record submission');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return submission_entry!;
    else throw new QueryExecutionError('creation of abstracted record submission entry');
}

export async function RemoveAbstractedRecordSubmissionEntry(filters: FilterQuery<IAbstractedRecordSubmissionModel & Document>, session?: ClientSession): Promise<Nullable<IAbstractedRecordSubmissionModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await AbstractedRecordSubmission.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of abstracted record submission entry');
    }
}

export async function RemoveAbstractedRecordSubmissionEntries(filters: FilterQuery<IAbstractedRecordSubmissionModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await AbstractedRecordSubmission.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of abstracted record submission entries');
    }
}

export async function CountAbstractedRecordSubmissions(filters?: FilterQuery<IAbstractedRecordSubmissionModel & Document>, session?: ClientSession): Promise<number> {
    return await AbstractedRecordSubmission.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchAbstractedRecordSubmissions(parameters: { filters: FilterQuery<IAbstractedRecordSubmissionModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IAbstractedRecordSubmissionModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IAbstractedRecordSubmissionModel>[]> {
    let query: Query<(IAbstractedRecordSubmissionModel & Document)[], IAbstractedRecordSubmissionModel & Document, {}> = AbstractedRecordSubmission.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}