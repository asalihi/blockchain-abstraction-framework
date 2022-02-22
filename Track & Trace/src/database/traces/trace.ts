import { IProcessTraceSchema, IProcessTraceModel } from './processes/trace';
import { IProcessVersionTraceSchema, IProcessVersionTraceModel } from './versions/trace';
import { IExecutionInstanceTraceSchema, IExecutionInstanceTraceModel } from './instances/trace';
import { IProcessElementTraceSchema, IProcessElementTraceModel } from './elements/trace';
import { ProcessTrace, ProcessVersionTrace, ExecutionInstanceTrace, ProcessElementTrace } from '@service/database/schemata';

export type SupportedTrackAndTraceTraceSchema = IProcessTraceSchema | IProcessVersionTraceSchema | IExecutionInstanceTraceSchema | IProcessElementTraceSchema;
export type SupportedTrackAndTraceTraceModel = IProcessTraceModel | IProcessVersionTraceModel | IExecutionInstanceTraceModel | IProcessElementTraceModel;
export const SupportedTrackAndTraceTraceModels = {
    'process': ProcessTrace,
    'version': ProcessVersionTrace,
    'instance': ExecutionInstanceTrace,
    'element': ProcessElementTrace
};
export const SupportedTrackAndTraceTraces: string[] = Object.keys(SupportedTrackAndTraceTraceModels);

export * from './trace.controller';
export * from './trace.interface';
export * from './trace.model';
export * from './processes/trace';
export * from './versions/trace';
export * from './instances/trace';
export * from './elements/trace';