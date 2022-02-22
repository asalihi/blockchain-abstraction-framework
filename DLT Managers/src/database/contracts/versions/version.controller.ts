import { ClientSession, Query } from 'mongoose';

import { Nullable, QueryExecutionError, ElementNotFoundInCollection } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IContractVersionSchema, IContractVersionModel } from './version';
import { ContractVersion, IContractModel, GetContractEntry } from '@service/database/schemata';

type ContractVersionQuery = Query<Nullable<IContractVersionModel>, IContractVersionModel>;

async function ExecuteQuery(process_identifier: string, version_identifier: string, operation: string, query: ProcessVersionQuery): Promise<IProcessVersionModel> {
	let version: Nullable<IContractVersionModel>;
	try {
		version = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (version) return version;

	throw new ElementNotFoundInCollection('smart contract version', `${ process_identifier }_${ version_identifier }`);
}

// TODO URGENT: Create same function with return of JSON object without _id and _v
export async function GetContractVersionEntry(contract: string, version: string, session?: ClientSession): Promise<IContractVersionModel> {
	const query: ContractVersionQuery = ContractVersion.findOne({ contract, version }).session(session ?? null);
	return ExecuteQuery(contract, version, 'fetch', query);
}

export async function CreateContractVersionEntry(parameters: Pick<IContractVersionSchema, 'contract' | 'version' | 'reference'>, session?: ClientSession): Promise<IContractVersionModel> {
	let success: boolean = false;
	let contract_version_entry: IContractVersionModel;

	const operations = async (parameters: Pick<IContractVersionSchema, 'contract' | 'version' | 'reference'>, session: ClientSession): Promise<void> => {
		let parent_contract: IContractModel;
		try {
            parent_contract = await GetContractEntry(parameters['contract']);
        } catch {
            throw new Error(`Parent contract does not exist (contract: ${parameters['contract']})`);
        }
		
		const versions: string[] = parent_contract.get('versions');
        if(versions.includes(parameters['version'])) throw new Error(`Contract version already exist (contract: ${ parameters['contract'] }, version: ${ parameters['version'] })`);
		
		contract_version_entry = await new ContractVersion(parameters).save({ session });

		versions.push(parameters['version']);
		parent_contract.markModified('versions');
		await parent_contract.save({ session });
		
		success = true;
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error: Error) => { /* TODO: Log error */ throw error });
	}

	if(success) return contract_version_entry!;
	else throw new QueryExecutionError('creation of smart contract version entry');
}