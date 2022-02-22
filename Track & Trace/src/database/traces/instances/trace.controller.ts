import config from 'config';
import { DeleteResult } from 'mongodb';
import { Document, Query, FilterQuery, LeanDocument, ClientSession } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty as empty } from 'lodash';

import { Identifier, Maybe, Nullable, Signature, Timestamp, QueryExecutionError, ElementNotFoundInCollection, ComputeSHA256, Sort, SignContent, ProcessTraceType, ExecutionInstanceTraceTypeValues, TraceDLTReference } from 'core';
import { DATABASE_CONNECTION as connection } from '@service/database/database';
import { IExecutionInstanceTraceSchema } from './trace.interface';
import { IExecutionInstanceTraceModel } from './trace.model';
import { IExecutionInstanceModel, ExecutionInstanceTrace, GetExecutionInstanceEntry, VerifyExecutionInstanceSignature } from '@service/database/schemata';
import { InvalidExecutionInstanceSignature } from '@service/errors/errors';
import { RegisterEntry } from '@service/controllers/blockchain';

type ExecutionInstanceTraceQuery = Query<Nullable<IExecutionInstanceTraceModel>, IExecutionInstanceTraceModel>;

async function ExecuteQuery(identifier: string, operation: string, query: ExecutionInstanceTraceQuery): Promise<IExecutionInstanceTraceModel> {
    let trace: Nullable<IExecutionInstanceTraceModel>;
    try {
        trace = await query.exec();
    } catch (error) {
        throw new QueryExecutionError(operation);
    }

    if (trace) return trace;

    throw new ElementNotFoundInCollection('execution instance trace', identifier);
}

export async function GetExecutionInstanceTraceEntry(identifier: string, session?: ClientSession): Promise<IExecutionInstanceTraceModel> {
    const query: ExecutionInstanceTraceQuery = ExecutionInstanceTrace.findOne({ identifier: identifier }).session(session ?? null);
    return ExecuteQuery(identifier, 'fetch', query);
}

export async function CreateExecutionInstanceTraceEntry(parameters: Pick<IExecutionInstanceTraceSchema, 'process' | 'version' | 'instance' | 'type'> & { 'identifier'?: Identifier } & { 'data'?: { [key: string]: any }}, session?: ClientSession): Promise<IExecutionInstanceTraceModel> {
    let success: boolean = false;
    let trace_entry: IExecutionInstanceTraceModel;

    const operations = async (parameters: Pick<IExecutionInstanceTraceSchema, 'process' | 'version' | 'instance' | 'type'> & { 'identifier'?: Identifier } & { 'data'?: { [key: string]: any }}, session: ClientSession): Promise<void> => {
        const execution_instance_entry: IExecutionInstanceModel = await GetExecutionInstanceEntry(parameters['instance'], session);

        if (ExecutionInstanceTraceTypeValues.includes(parameters['type'])) {
            const identifier: Identifier = parameters['identifier'] ?? uuidv4();
            const trace_type: ProcessTraceType = parameters['type'];

            let timestamp: Timestamp;
            if (trace_type === 'creation') timestamp = execution_instance_entry.get('creation');
            else if (trace_type === 'activation') timestamp = execution_instance_entry.get('start');
            else if (['termination', 'cancelation'].includes(trace_type)) timestamp = execution_instance_entry.get('stop');
            else timestamp = execution_instance_entry.get('deviation');

            // TODO URGENT: Signature should be verified during pre-validate hook
            // During creation, the verification is not needed
            // TODO: Handle case: If deactivation is requested before options have been saved in the custodian, verification will fail
            if ((parameters['type'] === 'deactivation') && (!VerifyExecutionInstanceSignature(execution_instance_entry))) throw new InvalidExecutionInstanceSignature(execution_instance_entry.get('instance'));
            
            const signature: Signature = SignContent(ComputeSHA256(`${identifier}_${timestamp}_${(parameters['data'] && !empty(parameters['data'])) ? '_' + ComputeSHA256(JSON.stringify(Sort(parameters['data']))) : ''}${execution_instance_entry.get('process')}_${execution_instance_entry.get('version')}_${execution_instance_entry.get('instance')}_${ComputeSHA256(execution_instance_entry.get('signature'))}_${trace_type}`), config.get('crypto.signing.keys.track_and_trace'));
            
            trace_entry = await new ExecutionInstanceTrace({ 'identifier': identifier, 'timestamp': timestamp, 'signature': signature, 'instance': execution_instance_entry.get('instance'), 'process': execution_instance_entry.get('process'), 'version': execution_instance_entry.get('version'), 'type': trace_type }).save({ session });
            
            // TODO: Handle better the registration of trace
            RegisterEntry(config.has('track-and-trace.storage.traces') ? config.get('track-and-trace.storage.traces') : 'fabric', 'trace', `instance:${identifier}`, ComputeSHA256(signature));

            success = true;
        } else throw new QueryExecutionError('creation of an invalid execution instance trace');
    };

    if (session) {
        await operations(parameters, session);
    } else {
        await connection.transaction(async function executor(session: ClientSession): Promise<void> {
            await operations(parameters, session);
        }).catch((error) => { /* TODO: Log error */ throw error });
    }

    if (success) return trace_entry!;
    else throw new QueryExecutionError('creation of execution instance trace entry');
}

export async function RemoveExecutionInstanceTraceEntry(filters: FilterQuery<IExecutionInstanceTraceModel & Document>, session?: ClientSession): Promise<Nullable<IExecutionInstanceTraceModel>> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ExecutionInstanceTrace.findOneAndDelete(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of execution instance trace entry');
    }
}

export async function RemoveExecutionInstanceTraceEntries(filters: FilterQuery<IExecutionInstanceTraceModel & Document>, session?: ClientSession): Promise<DeleteResult> {
    // TODO: Prevent use of this function, or delete it completely
    try {
        return await ExecutionInstanceTrace.deleteMany(filters).session(session ?? null);
    } catch {
        throw new QueryExecutionError('deletion of execution instance trace entry');
    }
}

export async function CountExecutionInstanceTraces(filters?: FilterQuery<IExecutionInstanceTraceModel & Document>, session?: ClientSession): Promise<number> {
    return await ExecutionInstanceTrace.countDocuments(filters ?? {}).session(session ?? null);
}

export async function FetchExecutionInstanceTraces(parameters: { filters: FilterQuery<IExecutionInstanceTraceModel & Document<any, any, any>>, page?: number, size?: number, sort_field?: keyof Omit<IExecutionInstanceTraceModel, 'signature' | 'reference'>, sort_direction?: 'asc' | 'desc' }, session?: ClientSession): Promise<LeanDocument<IExecutionInstanceTraceModel>[]> {
    let query: Query<(IExecutionInstanceTraceModel & Document)[], IExecutionInstanceTraceModel & Document, {}> = ExecutionInstanceTrace.find(parameters['filters']).skip((parameters['page'] ?? 0) * (parameters['size'] ?? 0)).limit(parameters['size'] ?? 0).session(session ?? null);

    if (parameters['sort_field']) {
        query = query.sort({ [parameters['sort_field']]: parameters['sort_direction'] });
    }

    return await query.lean().exec();
}

// TODO URGENT: Restrict modification (only one addition, then only change of state in a specific order)
export async function RegisterExecutionInstanceTraceReference(trace: Identifier, reference: TraceDLTReference, session?: ClientSession): Promise<void> {
    await ExecutionInstanceTrace.findOneAndUpdate({ 'identifier': trace }, { 'reference': reference }, { new: true, session });
}