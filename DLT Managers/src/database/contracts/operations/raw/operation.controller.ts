import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IRawContractOperationSchema } from './operation.interface';
import { IRawContractOperationModel } from './operation.model';
import { RawContractOperation } from '@service/database/schemata';

type RawContractOperationQuery = Query<Nullable<IRawContractOperationModel>, IRawContractOperationModel>;

async function ExecuteQuery(identifier: string, operation: string, query: RawContractOperationQuery): Promise<IRawContractOperationModel> {
    let raw_operation: Nullable<IRawContractOperationModel>;
    try {
        raw_operation = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (raw_operation) return raw_operation;

    throw new ElementNotFoundInCollection('smart contract raw operation', identifier);
}

export async function GetRawContractOperationEntry(identifier: string, session?: ClientSession): Promise<IRawContractOperationModel> {
    const query: RawContractOperationQuery = RawContractOperation.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateRawContractOperationEntry(parameters: Omit<IRawContractOperationSchema, 'context'>, session?: ClientSession): Promise<IRawContractOperationModel> {
    let success: boolean = false;
    let raw_operation_entry: IRawContractOperationModel;

    const operations = async (parameters: Omit<IRawContractOperationSchema, 'context'>, session: ClientSession): Promise<void> => {
        if(true) {
            success = true;
        } else throw new QueryExecutionError('creation of an invalid smart contract raw operation');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return raw_operation_entry!;
    else throw new QueryExecutionError('creation of smart contract raw operation entry');
}

export async function RemoveRawContractOperationEntry(filters: FilterQuery<IRawContractOperationModel & Document>, session?: ClientSession): Promise<Nullable<IRawContractOperationModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RawContractOperation.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract raw operation entry');
    }
}

export async function RemoveRawContractOperationEntries(filters: FilterQuery<IRawContractOperationModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await RawContractOperation.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract raw operations entries');
    }
}

export async function CountRawContractOperations(filters?: FilterQuery<IRawContractOperationModel & Document>, session?: ClientSession): Promise<number> {
    return await RawContractOperation.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchRawContractOperations(parameters: { filters: FilterQuery<IRawContractOperationModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IRawContractOperationModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IRawContractOperationModel>[]> {
    let query: Query<(IRawContractOperationModel & Document)[], IRawContractOperationModel & Document, {}> = RawContractOperation.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}