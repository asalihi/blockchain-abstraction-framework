import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Nullable, Signature, Timestamp, QueryExecutionError, ElementNotFoundInCollection, ComputeSHA256, Sort, SignContent, ProcessTraceType, ProcessTraceTypeValues, TraceDLTReference } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IProcessVersionTraceSchema } from './trace.interface';
import { IProcessVersionTraceModel } from './trace.model';
import { IProcessVersionModel, ProcessVersionTrace, GetProcessVersionEntry, VerifyProcessVersionSignature } from '@service/database/schemata';
import { InvalidProcessVersionSignature } from '@service/errors/errors';
import { RegisterEntry } from '@service/controllers/blockchain';

type ProcessVersionTraceQuery = Query<Nullable<IProcessVersionTraceModel>, IProcessVersionTraceModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ProcessVersionTraceQuery): Promise<IProcessVersionTraceModel> {
    let trace: Nullable<IProcessVersionTraceModel>;
    try {
        trace = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (trace) return trace;

    throw new ElementNotFoundInCollection('process version trace', identifier);
}

export async function GetProcessVersionTraceEntry(identifier: string, session?: ClientSession): Promise<IProcessVersionTraceModel> {
    const query: ProcessVersionTraceQuery = ProcessVersionTrace.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateProcessVersionTraceEntry(parameters: Pick<IProcessVersionTraceSchema, 'process' | 'version' | 'type'> & { 'identifier'?: Identifier } & { 'data'?: { [key: string]: any }}, session?: ClientSession): Promise<IProcessVersionTraceModel> {
    let success: boolean = false;
    let trace_entry: IProcessVersionTraceModel;

    const operations = async (parameters: Pick<IProcessVersionTraceSchema, 'process' | 'version' | 'type'> & { 'identifier'?: Identifier } & { 'data'?: { [key: string]: any }}, session: ClientSession): Promise<void> => {
        const process_version_entry: IProcessVersionModel = await GetProcessVersionEntry(parameters['process'], parameters['version'], session);

        if (ProcessTraceTypeValues.includes(parameters['type'])) {
            const identifier: Identifier = parameters['identifier'] ?? uuidv4();
            const trace_type: ProcessTraceType = parameters['type'];

            let timestamp: Timestamp;
            if (trace_type === 'creation') timestamp = process_version_entry.get('creation');
            else timestamp = process_version_entry.get('deactivation');

            // TODO URGENT: Signature should be verified during pre-validate hook
            // During creation, the verification is not needed
            // TODO: Handle case: If deactivation is requested before options have been saved in the custodian, verification will fail
            if ((parameters['type'] === 'deactivation') && (!(await VerifyProcessVersionSignature(process_version_entry, session)))) throw new InvalidProcessVersionSignature(process_version_entry.get('process'), process_version_entry.get('version'));

            const signature: Signature = SignContent(ComputeSHA256(`${identifier}_${timestamp}_${(parameters['data'] && !empty(parameters['data'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['data']))) : ''}${process_version_entry.get('process')}_${process_version_entry.get('version')}_${ComputeSHA256(process_version_entry.get('signature'))}_${trace_type}`), config.get('crypto.signing.keys.track_and_trace'));
            
            trace_entry = await new ProcessVersionTrace({ 'identifier': identifier, 'timestamp': timestamp, 'signature': signature, 'process': process_version_entry.get('process'), 'version': process_version_entry.get('version'), 'type': trace_type }).save({ session });
            // TODO: Handle better the registration of trace
            RegisterEntry(config.has('track-and-trace.storage.traces') ? config.get('track-and-trace.storage.traces') : 'fabric', 'trace', `version:${identifier}`, ComputeSHA256(signature));

            success = true;
        } else throw new QueryExecutionError('creation of an invalid process version trace');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return trace_entry!;
    else throw new QueryExecutionError('creation of process version trace entry');
}

export async function RemoveProcessVersionTraceEntry(filters: FilterQuery<IProcessVersionTraceModel & Document>, session?: ClientSession): Promise<Nullable<IProcessVersionTraceModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ProcessVersionTrace.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of process version trace entry');
    }
}

export async function RemoveProcessVersionTraceEntries(filters: FilterQuery<IProcessVersionTraceModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ProcessVersionTrace.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of process version trace entry');
    }
}


export async function CountProcessVersionTraces(filters?: FilterQuery<IProcessVersionTraceModel & Document>, session?: ClientSession): Promise<number> {
    return await ProcessVersionTrace.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchProcessVersionTraces(parameters: { filters: FilterQuery<IProcessVersionTraceModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof Omit<IProcessVersionTraceModel, 'signature' | 'reference'>, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IProcessVersionTraceModel>[]> {
    let query: Query<(IProcessVersionTraceModel & Document)[], IProcessVersionTraceModel & Document, {}> = ProcessVersionTrace.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}

// TODO URGENT: Restrict modification (only one addition, then only change of state in a specific order)
export async function RegisterProcessVersionTraceReference(trace: Identifier, reference: TraceDLTReference, session?: ClientSession): Promise<void> {
    await ProcessVersionTrace.findOneAndUpdate({ 'identifier': trace }, { 'reference': reference }, { new: true, session });
}