import config from 'config';
import { ClientSession, Query } from 'mongoose';

import { Nullable, Identifier, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { ContractOperationTask } from '@service/database/schemata';
import { IContractOperationTaskSchema, IContractOperationTaskModel } from './task';

type ContractOperationTaskQuery = Query<Nullable<IContractOperationTaskModel>, IContractOperationTaskModel>;

async function ExecuteQuery(task_identifier: string, operation: string, query: ContractOperationTaskQuery): Promise<IContractOperationTaskModel> {
	let task: Nullable<IContractOperationTaskModel>;
	try {
		task = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (task) return task;

	throw new ElementNotFoundInCollection('contract operation task', task_identifier);
}

// TODO URGENT: Create same function with return of JSON object without _id and _v
export async function GetContractOperationTaskEntry(task: string, session?: ClientSession): Promise<IContractOperationTaskModel> {
	const query: ContractOperationTaskQuery = ContractOperationTask.findOne({ identifier: task }).session(session ?? null);
	return ExecuteQuery(task, 'fetch', query);
}

export async function CreatContractOperationTaskEntry(parameters: Omit<IContractOperationTaskSchema, 'registration' | 'state'>, session?: ClientSession): Promise<IContractOperationTaskModel> {
	let success: boolean = false;
	let task_entry: IContractOperationTaskModel;

	const operations = async (parameters: Omit<IContractOperationTaskSchema, 'registration' | 'state'>, session: ClientSession): Promise<void> => {
			success = true;
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error: Error) => { /* TODO: Log error */ throw error });
	}

	if(success) return task_entry!;
	else throw new QueryExecutionError('creation of contract operation task entry');
}