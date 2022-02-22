import config from 'config';
import { isEmpty as empty } from 'lodash';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

import { Identifier, Nullable, Signature, Timestamp, QueryExecutionError, ElementNotFoundInCollection, ComputeSHA256, SignContent, RegisterReference, Sort, ProcessElementTraceType, ProcessElementTraceTypeValues, ProcessTaskOptions, TraceDLTReference } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IProcessElementTraceSchema } from './trace.interface';
import { IProcessElementTraceModel } from './trace.model';
import { ProcessElementTrace, IExecutionInstanceModel, GetExecutionInstanceEntry, VerifyExecutionInstanceSignature } from '@service/database/schemata';
import { InvalidExecutionInstanceSignature } from '@service/errors/errors';
import { RegisterEntry } from '@service/controllers/blockchain';

type ProcessElementTraceQuery = Query<Nullable<IProcessElementTraceModel>, IProcessElementTraceModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ProcessElementTraceQuery): Promise<IProcessElementTraceModel> {
    let trace: Nullable<IProcessElementTraceModel>;
    try {
        trace = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (trace) return trace;

    throw new ElementNotFoundInCollection('process element trace', identifier);
}

export async function GetProcessElementTraceEntry(identifier: string, session?: ClientSession): Promise<IProcessElementTraceModel> {
    const query: ProcessElementTraceQuery = ProcessElementTrace.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateProcessElementTraceEntry(parameters: Pick<IProcessElementTraceSchema, 'process' | 'version' | 'instance' | 'element' | 'type'> & { 'identifier'?: Identifier, 'options'?: ProcessTaskOptions, 'data'?: Object, 'validation'?: Object }, session?: ClientSession): Promise<IProcessElementTraceModel> {
    let success: boolean = false;
    let trace_entry: IProcessElementTraceModel;

    // TODO URGENT: Set type for 'verifications' key
    const operations = async (parameters: Pick<IProcessElementTraceSchema, 'process' | 'version' | 'instance' | 'element' | 'type'> & { 'identifier'?: Identifier, 'options'?: ProcessTaskOptions, 'data'?: Object, 'validation'?: Object }, session: ClientSession): Promise<void> => {
        const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(parameters['instance'], session);

        if (ProcessElementTraceTypeValues.includes(parameters['type'])) {
            const identifier: Identifier = parameters['identifier'] ?? uuidv4();
            const trace_type: ProcessElementTraceType = parameters['type'];
            const timestamp: Timestamp = Date.now();

            // TODO URGENT: Signature should be verified during pre-validate hook
            if (!VerifyExecutionInstanceSignature(execution_instance_entry)) throw new InvalidExecutionInstanceSignature(execution_instance_entry.get('instance'));

            const updates: Identifier[] = execution_instance_entry.get('traces.updates');
            const last_registered_identifier: Nullable<Identifier> = (updates?.length > 0) ? updates[updates.length - 1] : null;

            const signature: Signature = SignContent(ComputeSHA256(`${identifier}_${execution_instance_entry.get('process')}_${execution_instance_entry.get('version')}_${execution_instance_entry.get('instance')}_${ComputeSHA256(execution_instance_entry.get('signature'))}_${parameters['element']}_${trace_type}${last_registered_identifier ? '_' + last_registered_identifier : ''}${(parameters['data'] && !empty(parameters['data'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['data']))) : ''}${(parameters['options'] && !empty(parameters['options'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['options']))) : ''}${(parameters['validation'] && !empty(parameters['validation'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['validation']))) : ''}`), config.get('crypto.signing.keys.track_and_trace'));
            
            trace_entry = await new ProcessElementTrace({ 'identifier': identifier, 'timestamp': timestamp, 'signature': signature, 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'instance': execution_instance_entry.get('instance'), 'element': parameters['element'], 'type': trace_type }).save({ session });
            // TODO: Handle better the registration of trace
            RegisterEntry(config.has('track-and-trace.storage.traces') ? config.get('track-and-trace.storage.traces') : 'fabric', 'trace', `element:${identifier}`, ComputeSHA256(signature));

            success = true;
        } else throw new QueryExecutionError('creation of an invalid process task trace');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if(success) {
        const identifier: Identifier = trace_entry!.get('identifier');
        const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(parameters['instance'], session);
        
    }

    if (success) return trace_entry!;
    else throw new QueryExecutionError('creation of process task trace entry');
}

export async function RegisterProcessElementTraceResource(identifier: Identifier, repository: string, resource: string, data: any, path: string = `resources.${resource}`): Promise<void> {
    try {
        const trace_entry: IProcessElementTraceModel = await GetProcessElementTraceEntry(identifier);
        const reference: any = await RegisterReference(repository, data);
        RegisterEntry(config.has(`track-and-trace.storage.${resource}`) ? config.get(`track-and-trace.storage.${resource}`) : 'fabric', 'data', reference['identifier'], reference['fingerprint']);
        trace_entry.set(path, reference['identifier']);
        trace_entry.markModified(path);
        await trace_entry.save();
    } catch(error) {
        // TODO: Handle error
        throw error;
    }
}

export async function RemoveProcessElementTraceEntry(filters: FilterQuery<IProcessElementTraceModel & Document>, session?: ClientSession): Promise<Nullable<IProcessElementTraceModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ProcessElementTrace.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of process task trace entry');
    }
}

export async function RemoveProcessElementTraceEntries(filters: FilterQuery<IProcessElementTraceModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ProcessElementTrace.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of process task trace entry');
    }
}


export async function CountProcessElementTraces(filters?: FilterQuery<IProcessElementTraceModel & Document>, session?: ClientSession): Promise<number> {
    return await ProcessElementTrace.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchProcessElementTraces(parameters: { filters: FilterQuery<IProcessElementTraceModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof Omit<IProcessElementTraceModel, 'signature' | 'reference'>, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IProcessElementTraceModel>[]> {
    let query: Query<(IProcessElementTraceModel & Document)[], IProcessElementTraceModel & Document, {}> = ProcessElementTrace.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}

// TODO URGENT: Restrict modification (only one addition, then only change of state in a specific order)
export async function RegisterProcessElementTraceReference(trace: Identifier, reference: TraceDLTReference, session?: ClientSession): Promise<void> {
    await ProcessElementTrace.findOneAndUpdate({ 'identifier': trace }, { 'reference': reference }, { new: true, session });
}