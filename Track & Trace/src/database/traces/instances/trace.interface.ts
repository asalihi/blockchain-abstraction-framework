import { Identifier, ExecutionInstanceTraceType } from 'core';
import { ITrackAndTraceTraceSchema } from '../trace.interface';

export interface IExecutionInstanceTraceSchema extends ITrackAndTraceTraceSchema {
    context: 'instance',
    instance: Identifier,
    process: Identifier,
    version: Identifier,
    type: ExecutionInstanceTraceType
}