import { Identifier, Signature, Timestamp, ExecutionInstanceState, ProcessExecution, ExecutionInstanceResources, ExecutionInstanceTraces } from 'core';

export interface IExecutionInstanceSchema {
    'process': Identifier,
    'version': Identifier,
    'instance': Identifier,
    'state': ExecutionInstanceState,
    'creation': Timestamp,
    'start'?: Timestamp,
    'deviation'?: Timestamp,
    'stop'?: Timestamp,
    'signature': Signature,
    'execution': ProcessExecution,
    'resources': ExecutionInstanceResources,
    'traces': ExecutionInstanceTraces
}