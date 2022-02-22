import { Identifier, Signature, Timestamp, ProcessState, ListOfProcessVersions, ProcessResources, ProcessTraces } from 'core';

export interface IProcessSchema {
    'process': Identifier,
    'state': ProcessState,
    'creation': Timestamp,
    'deactivation'?: Timestamp,
    'resources': ProcessResources,
    'signature': Signature,
    'versions': ListOfProcessVersions,
    'traces': ProcessTraces
}