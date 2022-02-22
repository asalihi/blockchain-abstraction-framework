import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IContractInvocationSchema } from './operation.interface';
import { IContractInvocationModel } from './operation.model';
import { ContractInvocation } from '@service/database/schemata';

type ContractInvocationQuery = Query<Nullable<IContractInvocationModel>, IContractInvocationModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ContractInvocationQuery): Promise<IContractInvocationModel> {
    let invocation: Nullable<IContractInvocationModel>;
    try {
        invocation = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (invocation) return invocation;

    throw new ElementNotFoundInCollection('smart contract invocation', identifier);
}

export async function GetContractInvocationEntry(identifier: string, session?: ClientSession): Promise<IContractInvocationModel> {
    const query: ContractInvocationQuery = ContractInvocation.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateContractInvocationEntry(parameters: Omit<IContractInvocationSchema, 'context'>, session?: ClientSession): Promise<IContractInvocationModel> {
    let success: boolean = false;
    let invocation_entry: IContractInvocationModel;

    const operations = async (parameters: Omit<IContractInvocationSchema, 'context'>, session: ClientSession): Promise<void> => {
        if(true) {
            success = true;
        } else throw new QueryExecutionError('creation of an invalid smart contract invocation');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return invocation_entry!;
    else throw new QueryExecutionError('creation of smart contract invocation entry');
}

export async function RemoveContractInvocationEntry(filters: FilterQuery<IContractInvocationModel & Document>, session?: ClientSession): Promise<Nullable<IContractInvocationModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ContractInvocation.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract invocation entry');
    }
}

export async function RemoveContractInvocationEntries(filters: FilterQuery<IContractInvocationModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ContractInvocation.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract invocation entries');
    }
}

export async function CountContractInvocations(filters?: FilterQuery<IContractInvocationModel & Document>, session?: ClientSession): Promise<number> {
    return await ContractInvocation.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchContractInvocations(parameters: { filters: FilterQuery<IContractInvocationModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IContractInvocationModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IContractInvocationModel>[]> {
    let query: Query<(IContractInvocationModel & Document)[], IContractInvocationModel & Document, {}> = ContractInvocation.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}