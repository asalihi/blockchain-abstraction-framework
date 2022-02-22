import config from 'config';
import { ClientSession, Document, Query, FilterQuery } from 'mongoose';

import { Nullable, Identifier, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { Contract } from '@service/database/schemata';
import { IContractSchema, IContractModel } from './contract';

type ContractQuery = Query<Nullable<IContractModel>, IContractModel>;

async function ExecuteQuery(contract_identifier: string, operation: string, query: ContractQuery): Promise<IContractModel> {
	let contract: Nullable<IContractModel>;
	try {
		contract = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (contract) return contract;

	throw new ElementNotFoundInCollection('contract', contract_identifier);
}

// TODO URGENT: Create same function with return of JSON object without _id and _v
export async function GetContractEntry(contract: string, session?: ClientSession): Promise<IContractModel> {
	const query: ContractQuery = Contract.findOne({ identifier: contract }).session(session ?? null);
	return ExecuteQuery(contract, 'fetch', query);
}

export async function CreateContractEntry(parameters: Pick<IContractSchema, 'identifier' | 'instance' | 'network' | 'options' | 'metadata'>, session?: ClientSession): Promise<IContractModel> {
	let success: boolean = false;
	let contract_entry: IContractModel;

	const operations = async (parameters: Pick<IContractSchema, 'identifier' | 'instance' | 'network' | 'options' | 'metadata'>, session: ClientSession): Promise<void> => {
		contract_entry = await new Contract(parameters).save({ session });
		success = true;
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error: Error) => { /* TODO: Log error */ throw error });
	}

	if(success) return contract_entry!;
	else throw new QueryExecutionError('creation of contract entry');
}