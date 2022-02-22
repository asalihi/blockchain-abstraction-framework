import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { IContractOperationModel } from './operation.model';
import { SupportedContractOperationModel } from './operation';
import { IContractOperationSchema } from './operation.interface';
import { ContractOperation } from '@service/database/schemata';

type ContractOperationQuery = Query<Nullable<IContractOperationModel>, Document<IContractOperationModel>>;

async function ExecuteQuery(identifier: string, operation: string, query: ContractOperationQuery): Promise<SupportedContractOperationModel> {
    let contract_operation: Nullable<IContractOperationModel>;
    try {
        contract_operation = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (contract_operation) return contract_operation as SupportedContractOperationModel;

    throw new ElementNotFoundInCollection('smart contract operation', identifier);
}

export async function GetContractOperationEntry(identifier: string, session?: ClientSession): Promise<SupportedContractOperationModel> {
    const query: ContractOperationQuery = ContractOperation.findOne({ identifier: identifier }).session(session ?? null);
    return await ExecuteQuery(identifier, 'fetch', query);
}

export async function RemoveContractOperationEntry(identifier: string, session?: ClientSession): Promise<Nullable<SupportedContractOperationModel>> {
    // TODO: Prevent use of this function, or delete it completely
    const query: ContractOperationQuery = ContractOperation.findOneAndDelete({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'deletion of smart contract operation entry', query);
}

export async function RemoveContractOperationEntries(filters: FilterQuery<IContractOperationModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ContractOperation.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract operation entries');
    }
}

export async function CountContractOperations(filters?: FilterQuery<SupportedContractOperationModel & Document>, session?: ClientSession): Promise<number> {
    return await ContractOperation.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchContractOperationEntries(parameters: { filters: FilterQuery<IContractOperationModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IContractOperationSchema, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<SupportedContractOperationModel>[]> {
    let query: Query<(IContractOperationModel & Document)[], IContractOperationModel & Document, {}> = ContractOperation.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec() as SupportedContractOperationModel[];
}