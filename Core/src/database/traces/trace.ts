import { ITraceSchema } from './trace.interface';
import { ITraceModel } from './trace.model';
import { Trace } from '@core/database/schemata';

export type SupportedTraceSchema = ITraceSchema;
export type SupportedTraceModel = ITraceModel;
export const SupportedTraceModels = {
    'generic': Trace
};
export const SupportedTraces: string[] = Object.keys(SupportedTraceModels);

export * from './trace.controller';
export * from './trace.interface';
export * from './trace.model';