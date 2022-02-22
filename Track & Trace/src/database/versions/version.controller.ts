import config from 'config';
import { isEmpty as empty } from 'lodash';
import { ClientSession, Document, Query, FilterQuery } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Identifier, Timestamp, Signature, Nullable, QueryExecutionError, ElementNotFoundInCollection, ComputeSHA256, SignContent, VerifySignature, RegisterReference, RetrieveData, ProcessVersionOptions, TreeOfProcessObjects, Sort, RegisteredData } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IProcessVersionSchema, IProcessVersionModel } from './version';
import { ProcessVersion, IProcessModel, GetProcessEntry, IProcessVersionTraceModel, CreateProcessVersionTraceEntry, CancelExecutionInstanceEntry } from '@service/database/schemata';
import { RegisterEntry } from '@service/controllers/blockchain';

type ProcessVersionQuery = Query<Nullable<IProcessVersionModel>, IProcessVersionModel>;

async function ExecuteQuery(process_identifier: string, version_identifier: string, operation: string, query: ProcessVersionQuery): Promise<IProcessVersionModel> {
	let version: Nullable<IProcessVersionModel>;
	try {
		version = await query.exec();
	} catch (error) {
		throw new QueryExecutionError(operation);
	}

	if (version) return version;

	throw new ElementNotFoundInCollection('process version', `${ process_identifier }_${ version_identifier }`);
}

// TODO URGENT: Create same function with return of JSON object without _id and _v
export async function GetProcessVersionEntry(process: string, version: string, session?: ClientSession): Promise<IProcessVersionModel> {
	const query: ProcessVersionQuery = ProcessVersion.findOne({ process: process, version: version }).session(session ?? null);
	return ExecuteQuery(process, version, 'fetch', query);
}

export async function CreateProcessVersionEntry(parameters: Pick<IProcessVersionSchema, 'process'> & Partial<Pick<IProcessVersionSchema, 'version'>> & { file: string } & { tree: TreeOfProcessObjects } & { options?: ProcessVersionOptions } & { data?: Object }, session?: ClientSession): Promise<IProcessVersionModel> {
	let success: boolean = false;
	let process_version_entry: IProcessVersionModel;

	const operations = async (parameters: Pick<IProcessVersionSchema, 'process'> & Partial<Pick<IProcessVersionSchema, 'version'>> & { file: string } & { tree: TreeOfProcessObjects } & { options?: ProcessVersionOptions } & { data?: Object }, session: ClientSession): Promise<void> => {
		const process_entry: IProcessModel = await GetProcessEntry(parameters['process'], session);
		if (process_entry.get('state') === 'active') {
			const creation: Timestamp = Date.now();
			const version: Identifier = parameters['version'] ?? uuidv4();

			const signature: Signature = SignContent(ComputeSHA256(`${parameters['process']}_${version}_${creation}_${process_entry.get('signature')}_${ComputeSHA256(parameters['file'])}_${ComputeSHA256(JSON.stringify(Sort(parameters['tree'])))}${(parameters['options'] && !empty(parameters['options'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['options']))) : ''}`), config.get('crypto.signing.keys.track_and_trace'));
			
			const file_reference: any = await RegisterReference('track-and-trace-processes', { 'process': parameters['process'], 'version': version, 'file': parameters['file'], 'tree': parameters['tree'] });
			RegisterEntry(config.has('track-and-trace.storage.data') ? config.get('track-and-trace.storage.data') : 'fabric', 'data', file_reference['identifier'], file_reference['fingerprint']);
			
			process_version_entry = await new ProcessVersion(Object.assign(parameters, { version }, { 'state': 'active', 'creation': creation, 'signature': signature, 'instances': [], 'resources': { 'file': file_reference['identifier'] } })).save({ session });
			
			const trace: IProcessVersionTraceModel = await CreateProcessVersionTraceEntry({ 'process': parameters['process'], 'version': version, 'type': 'creation', 'data': parameters['data'] }, session);
			process_version_entry.set('traces.creation', trace.get('identifier'));
			process_version_entry.markModified('traces.creation');
			await process_version_entry.save({ session });

			await process_entry.update({ $push: { 'versions': version } }, { upsert: true, new: true, session });

			success = true;
		} else {
			// TODO: Cancel data registration by submitting a message to Data Manager using the message queue of the platform
			// TODO: Handle error
			throw new Error('Process is not active');
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	if(success) return process_version_entry!;
	else throw new QueryExecutionError('creation of process version entry');
}

export async function RegisterProcessVersionResource(process: Identifier, version: Identifier, repository: string, resource: string, data: any, path: string = `resources.${resource}`): Promise<void> {
    try {
        const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(process, version);
        const reference: any = await RegisterReference(repository, data);
        RegisterEntry(config.has(`track-and-trace.storage.${resource}`) ? config.get(`track-and-trace.storage.${resource}`) : 'fabric', 'data', reference['identifier'], reference['fingerprint']);
        process_version_entry.set(path, reference['identifier']);
        process_version_entry.markModified(path);
        await process_version_entry.save();
    } catch(error) {
        // TODO: Handle error
        throw error;
    }
}

export async function DeactivateProcessVersionEntry(parameters: { process_identifier: Identifier, version_identifier: Identifier, data?: Object }, session?: ClientSession): Promise<IProcessVersionModel> {
	let success: boolean = false;
	let process_version_entry: IProcessVersionModel;

	const operations = async (parameters: { process_identifier: Identifier, version_identifier: Identifier, data?: Object }, session: ClientSession): Promise<void> => {
		process_version_entry = await GetProcessVersionEntry(parameters['process_identifier'], parameters['version_identifier'], session);

		if (process_version_entry.get('state') === 'active') {
			await Promise.all(process_version_entry.get('instances').map((execution_instance_identifier: Identifier) => {
				return CancelExecutionInstanceEntry({ instance: execution_instance_identifier }, session).catch((error: Error) => {
					// TODO URGENT: Handle case correctly (if exception is because instance is not running, we ignore because here it is safe to do so; check with instanceof)
					if (error.message !== 'Execution instance is not active') throw error;
				});
			}));

			process_version_entry.set('state', 'deactivated');
			process_version_entry.set('deactivation', Date.now());
			await process_version_entry.save({ session });

			const trace: IProcessVersionTraceModel = await CreateProcessVersionTraceEntry({ 'process': parameters['process_identifier'], 'version': parameters['version_identifier'], 'type': 'deactivation', 'data': parameters['data'] }, session);
			
			process_version_entry.set('traces.creation', trace.get('identifier'));
			process_version_entry.markModified('traces.creation');
			await process_version_entry.save({ session });
			success = true;
		} else {
			// TODO: Handle error
			throw new Error('Process version is not active');
		}
	};

	if (session) {
		await operations(parameters, session);
	} else {
		await connection.transaction(async function executor(session: ClientSession): Promise<void> {
			await operations(parameters, session);
		}).catch((error) => { /* TODO: Log error */ throw error });
	}

	if (success) return process_version_entry!;
	// TODO: Handle error
	else throw new Error('An error occurred during deactivation of process version');
}

export async function VerifyProcessVersionSignature(process_version: IProcessVersionModel, session?: ClientSession): Promise<boolean> {
	// TODO: Handle better the retrieval of data
	const process_entry: IProcessModel = await GetProcessEntry(process_version.get('process'), session);
	const process_version_model: RegisteredData = await RetrieveData(process_version.get('resources.file'));
	const process_version_options: Nullable<RegisteredData> = process_version.get('resources.options') ? await RetrieveData(process_version.get('resources.options')) : null;

	return VerifySignature(process_version.get('signature'), config.get('crypto.signing.keys.track_and_trace')) === ComputeSHA256(`${process_version.get('process')}_${process_version.get('version')}_${process_version.get('creation')}_${process_entry.get('signature')}_${ComputeSHA256(process_version_model['data']['file'])}_${ComputeSHA256(JSON.stringify(Sort(process_version_model['data']['tree'])))}${process_version_options ? '_' + ComputeSHA256(JSON.stringify(Sort(process_version_options['data']['options']))) : ''}`);
}

export async function CountProcessVersions(filters?: FilterQuery<IProcessVersionModel & Document>, session?: ClientSession): Promise<number> {
	return await ProcessVersion.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchProcessVersions(parameters: any, session?: ClientSession): Promise<(IProcessVersionSchema & { '_id'?: string })[]> {
	let query: Query<(IProcessVersionModel & Document)[], IProcessVersionModel & Document, {}> = ProcessVersion.find(parameters['filters']).skip(parameters['page'] * parameters['size']).limit(parameters['size']).select('-tree').session(session ?? null);

	if (parameters['sort_field']) {
		query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
	}

	return await query.lean().exec();
}