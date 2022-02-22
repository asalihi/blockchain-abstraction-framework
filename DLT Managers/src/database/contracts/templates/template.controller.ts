import config from 'config';
import { ClientSession, Query } from 'mongoose';

import { Nullable, Identifier, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { ContractTemplate } from '@service/database/schemata';
import { IContractTemplateSchema, IContractTemplateModel } from './template';

type ContractTemplateQuery = Query<Nullable<IContractTemplateModel>, IContractTemplateModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ContractTemplateQuery): Promise<IContractTemplateModel> {
	let template: Nullable<IContractTemplateModel>;
	try {
		template = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (template) return template;

	throw new ElementNotFoundInCollection('contract template', identifier);
}

// TODO URGENT: Create same function with return of JSON object without _id and _v
export async function GetContractTemplateEntry(contract: string, session?: ClientSession): Promise<IContractTemplateModel> {
	const query: ContractTemplateQuery = ContractTemplate.findOne({ identifier: contract }).session(session ?? null);
	return ExecuteQuery(contract, 'fetch', query);
}

export async function CreatContractTemplateEntry(parameters: Omit<IContractTemplateSchema, 'state'>, session?: ClientSession): Promise<IContractTemplateModel> {
	let success: boolean = false;
	let template_entry: IContractTemplateModel;

	const operations = async (parameters: Omit<IContractTemplateSchema, 'state'>, session: ClientSession): Promise<void> => {
			success = true;
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	if(success) return template_entry!;
	else throw new QueryExecutionError('creation of contract template entry');
}