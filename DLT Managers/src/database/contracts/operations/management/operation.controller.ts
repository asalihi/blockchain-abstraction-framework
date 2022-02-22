import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IContractManagementSchema } from './operation.interface';
import { IContractManagementModel } from './operation.model';
import { ContractManagement } from '@service/database/schemata';

type ContractManagementQuery = Query<Nullable<IContractManagementModel>, IContractManagementModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ContractManagementQuery): Promise<IContractManagementModel> {
    let management: Nullable<IContractManagementModel>;
    try {
        management = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (management) return management;

    throw new ElementNotFoundInCollection('smart contract management', identifier);
}

export async function GetContractManagementEntry(identifier: string, session?: ClientSession): Promise<IContractManagementModel> {
    const query: ContractManagementQuery = ContractManagement.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateContractManagementEntry(parameters: Omit<IContractManagementSchema, 'context'>, session?: ClientSession): Promise<IContractManagementModel> {
    let success: boolean = false;
    let management_entry: IContractManagementModel;

    const operations = async (parameters: Omit<IContractManagementSchema, 'context'>, session: ClientSession): Promise<void> => {
        if(true) {
            success = true;
        } else throw new QueryExecutionError('creation of an invalid smart contract management');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return management_entry!;
    else throw new QueryExecutionError('creation of smart contract management entry');
}

export async function RemoveContractManagementEntry(filters: FilterQuery<IContractManagementModel & Document>, session?: ClientSession): Promise<Nullable<IContractManagementModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ContractManagement.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract management entry');
    }
}

export async function RemovevContractManagementEntries(filters: FilterQuery<IContractManagementModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ContractManagement.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of smart contract management entries');
    }
}

export async function CountContractManagements(filters?: FilterQuery<IContractManagementModel & Document>, session?: ClientSession): Promise<number> {
    return await ContractManagement.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchContractManagements(parameters: { filters: FilterQuery<IContractManagementModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof IContractManagementModel, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IContractManagementModel>[]> {
    let query: Query<(IContractManagementModel & Document)[], IContractManagementModel & Document, {}> = ContractManagement.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}