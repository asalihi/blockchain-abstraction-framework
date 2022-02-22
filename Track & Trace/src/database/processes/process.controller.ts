import config from 'config';
import { isEmpty as empty } from 'lodash';
import { ClientSession, Document, Query, FilterQuery } from 'mongoose';

import { Identifier, Nullable, Signature, Timestamp, QueryExecutionError, ElementNotFoundInCollection, ProcessOptions, SignContent, ComputeSHA256, VerifySignature, RegisterReference, RetrieveData, Sort } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IProcessSchema, IProcessModel } from './process';
import { Process, DeactivateProcessVersionEntry, IProcessTraceModel, CreateProcessTraceEntry } from '@service/database/schemata';
import { RegisterEntry } from '@service/controllers/blockchain';

type ProcessQuery = Query<Nullable<IProcessModel>, IProcessModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ProcessQuery): Promise<IProcessModel> {
    let process: Nullable<IProcessModel>;
    try {
        process = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (process) return process;

    throw new ElementNotFoundInCollection('process', identifier);
}

export async function GetProcessEntry(identifier: string, session?: ClientSession): Promise<IProcessModel> {
    const query: ProcessQuery = Process.findOne({ process: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateProcessEntry(parameters: { identifier: Identifier, data?: Object, options?: ProcessOptions }, session?: ClientSession): Promise<IProcessModel> {
    let success: boolean = false;
    let process_entry: IProcessModel;

    const operations = async (parameters: { identifier: Identifier, data?: Object, options?: ProcessOptions }, session: ClientSession): Promise<void> => {
        const creation: Timestamp = Date.now();

        // TODO: Include data in signature (+ in verification of signature)
        const signature: Signature = SignContent(ComputeSHA256(`${parameters['identifier']}_${creation}${(parameters['options'] && !empty(parameters['options'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['options']))) : ''}`), config.get('crypto.signing.keys.track_and_trace'));
        process_entry = await new Process({ 'process': parameters['identifier'], 'state': 'active', 'creation': creation, 'signature': signature }).save({ session });
        // TODO URGENT: Data should be registered as part of the trace too
        const trace: IProcessTraceModel = await CreateProcessTraceEntry({ 'process': parameters['identifier'], 'type': 'creation', 'data': parameters['data'] }, session);
        process_entry.set('traces.creation', trace.get('identifier'));
        process_entry.markModified('traces.creation');
        await process_entry.save({ session });
        success = true;
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => {
        // TODO: Log
        });
    }

    if (success) return process_entry!;
    else throw new QueryExecutionError('creation of process entry');
}

export async function RegisterProcessResource(process: Identifier, repository: string, resource: string, data: any, path: string = `resources.${resource}`): Promise<void> {
    try {
        const process_entry: IProcessModel = await GetProcessEntry(process);
        const reference: any = await RegisterReference(repository, data);
        RegisterEntry(config.has(`track-and-trace.storage.${resource}`) ? config.get(`track-and-trace.storage.${resource}`) : 'fabric', 'data', reference['identifier'], reference['fingerprint']);
        process_entry.set(path, reference['identifier']);
        process_entry.markModified(path);
        await process_entry.save();
    } catch(error) {
        // TODO: Handle error
        throw error;
    }
}

export async function DeactivateProcessEntry(parameters: { process_identifier: Identifier, data?: Object }, session?: ClientSession): Promise<IProcessModel> {
    let success: boolean = false;
    let process_entry: IProcessModel;

    const operations = async (parameters: { process_identifier: Identifier, data?: Object }, session: ClientSession): Promise<void> => {
        const process_identifier: Identifier = parameters['process_identifier'];
        process_entry = await GetProcessEntry(process_identifier, session);
        await Promise.all(process_entry.get('versions').map((version_identifier: Identifier) => {
            return DeactivateProcessVersionEntry({ process_identifier, version_identifier }, session).catch((error: Error) => {
                // TODO: Handle case correctly (if exception is because instance is not running, we ignore because here it is safe to do so; check with instanceof)
                if (error.message !== 'Process version is not active') throw error;
            });
        }));

        process_entry.set('state', 'deactivated');
        process_entry.set('deactivation', Date.now());
        await process_entry.save({ session });

        const trace: IProcessTraceModel = await CreateProcessTraceEntry({ 'process': process_identifier, 'type': 'deactivation', 'data': parameters['data'] }, session);

        process_entry.set('traces.deactivation', trace.get('identifier'));
        process_entry.markModified('traces.deactivation');
        await process_entry.save({ session });

        success = true;
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return process_entry!;
    // TODO: Handle error
    else throw new Error('An error occurred during deactivation of process');
}

export async function CountProcesses(filters?: FilterQuery<IProcessModel & Document>, session?: ClientSession): Promise<number> {
    return await Process.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchProcesses(parameters: any, session?: ClientSession): Promise<(IProcessSchema & { '_id'?: string })[]> {
    let query: Query<(IProcessModel & Document)[], IProcessModel & Document, {}> = Process.find(parameters['filters']).skip(parameters['page'] * parameters['size']).limit(parameters['size']).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}

export async function VerifyProcessSignature(process_entry: IProcessModel, session?: ClientSession): Promise<boolean> {
    return VerifySignature(process_entry.get('signature'), config.get('crypto.signing.keys.track_and_trace')) === ComputeSHA256(`${process_entry.get('process')}_${process_entry.get('creation')}${process_entry.get('resources.options') ? '_' + ComputeSHA256(JSON.stringify(Sort((await RetrieveData(process_entry.get('resources.options')))['data']['options']))) : ''}`);
}