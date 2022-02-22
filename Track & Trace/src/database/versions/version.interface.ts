import { Identifier, Signature, Timestamp, ProcessState, ListOfInstances, ProcessVersionResources, ProcessVersionTraces } from 'core';

export interface IProcessVersionSchema {
    'process': Identifier,
    'version': Identifier,
    'state': ProcessState,
    'creation': Timestamp,
    'deactivation'?: Timestamp,
    'signature': Signature,
    'instances': ListOfInstances,
    'traces': ProcessVersionTraces,
    'resources': ProcessVersionResources
}