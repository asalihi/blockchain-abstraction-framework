import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Maybe, Nullable, Signature, Timestamp, QueryExecutionError, ElementNotFoundInCollection, ComputeSHA256, Sort, SignContent, ProcessTraceType, ProcessTraceTypeValues, TraceDLTReference } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IProcessTraceSchema } from './trace.interface';
import { IProcessTraceModel } from './trace.model';
import { IProcessModel, ProcessTrace, GetProcessEntry, VerifyProcessSignature } from '@service/database/schemata';
import { InvalidProcessSignature } from '@service/errors/errors';
import { RegisterEntry } from '@service/controllers/blockchain';

type ProcessTraceQuery = Query<Nullable<IProcessTraceModel>, IProcessTraceModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ProcessTraceQuery): Promise<IProcessTraceModel> {
    let trace: Nullable<IProcessTraceModel>;
    try {
        trace = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (trace) return trace;

    throw new ElementNotFoundInCollection('process trace', identifier);
}

export async function GetProcessTraceEntry(identifier: string, session?: ClientSession): Promise<IProcessTraceModel> {
    const query: ProcessTraceQuery = ProcessTrace.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateProcessTraceEntry(parameters: Pick<IProcessTraceSchema, 'process' | 'type'> & { 'identifier'?: Identifier } & { 'data'?: { [key: string]: any }}, session?: ClientSession): Promise<IProcessTraceModel> {
    let success: boolean = false;
    let trace_entry: IProcessTraceModel;

    const operations = async (parameters: Pick<IProcessTraceSchema, 'process' | 'type'> & { 'identifier'?: Identifier } & { 'data'?: { [key: string]: any }}, session: ClientSession): Promise<void> => {
        const process_entry: IProcessModel = await GetProcessEntry(parameters['process'], session);
        
        if (ProcessTraceTypeValues.includes(parameters['type']) && process_entry.get(parameters['type'])) {
            const identifier: Identifier = parameters['identifier'] ?? uuidv4();
            const trace_type: ProcessTraceType = parameters['type'];
            const timestamp: Timestamp = process_entry.get(trace_type);

            // TODO URGENT: Signature should be verified during pre-validate hook
            // During creation, the verification is not needed
            // TODO: Handle case: If deactivation is requested before options have been saved in the custodian, verification will fail
            if ((parameters['type'] === 'deactivation') && (!(await VerifyProcessSignature(process_entry, session)))) throw new InvalidProcessSignature(process_entry.get('process'));

            const signature: Signature = SignContent(ComputeSHA256(`${identifier}_${timestamp}_${(parameters['data'] && !empty(parameters['data'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['data']))) : ''}${process_entry.get('process')}_${trace_type}_${ComputeSHA256(process_entry.get('signature'))}`), config.get('crypto.signing.keys.track_and_trace'));

            trace_entry = await new ProcessTrace({ 'identifier': identifier, 'timestamp': timestamp, 'signature': signature, 'process': process_entry.get('process'), 'type': trace_type }).save({ session });
            // TODO: Handle better the registration of trace
            RegisterEntry(config.has('track-and-trace.storage.traces') ? config.get('track-and-trace.storage.traces') : 'fabric', 'trace', `process:${identifier}`, ComputeSHA256(signature));
            
            success = true;
        } else throw new QueryExecutionError('creation of an invalid process trace');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return trace_entry!;
    else throw new QueryExecutionError('creation of process trace entry');
}

export async function RemoveProcessTraceEntry(filters: FilterQuery<IProcessTraceModel & Document>, session?: ClientSession): Promise<Nullable<IProcessTraceModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ProcessTrace.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of process trace entry');
    }
}

export async function RemoveProcessTraceEntries(filters: FilterQuery<IProcessTraceModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ProcessTrace.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of process trace entry');
    }
}

export async function CountProcessTraces(filters?: FilterQuery<IProcessTraceModel & Document>, session?: ClientSession): Promise<number> {
    return await ProcessTrace.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchProcessTraces(parameters: { filters: FilterQuery<IProcessTraceModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof Omit<IProcessTraceModel, 'signature' | 'reference'>, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IProcessTraceModel>[]> {
    let query: Query<(IProcessTraceModel & Document)[], IProcessTraceModel & Document, {}> = ProcessTrace.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}

// TODO URGENT: Restrict modification (only one addition, then only change of state in a specific order)
export async function RegisterProcessTraceReference(trace: Identifier, reference: TraceDLTReference, session?: ClientSession): Promise<void> {
    await ProcessTrace.findOneAndUpdate({ 'identifier': trace }, { 'reference': reference }, { new: true, session });
}