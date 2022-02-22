import { Identifier, ProcessElementTraceType, ProcessTaskTraceResources } from 'core';
import { ITrackAndTraceTraceSchema } from '../trace.interface';

export interface IProcessElementTraceSchema extends ITrackAndTraceTraceSchema {
    context: 'task',
    instance: Identifier,
    process: Identifier,
    version: Identifier,
    element: Identifier,
    resources: ProcessTaskTraceResources,
    type: ProcessElementTraceType
}