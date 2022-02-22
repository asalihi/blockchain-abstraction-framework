import { Identifier, ProcessOptions, ProcessVersionOptions, ExecutionInstanceOptions } from '@core/types/types';

export interface IProcessVersionParameters {
    'identifier': Identifier,
    'file': string,
    'data'?: Object,
    'options'?: ProcessVersionOptions
}

export interface IProcessWithVersions {
    'process': Identifier,
    'versions': IProcessVersionParameters[],
    'data'?: Object,
    'options'?: ProcessOptions
}

export interface IExecutionInstanceParameters {
    'instance': Identifier,
    'data'?: Object,
    'options'?: ExecutionInstanceOptions
}

export type ExecutionInstanceUpdateOptions = Partial<{ deviation: boolean }>;