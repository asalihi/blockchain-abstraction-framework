import { Identifier, Fingerprint } from 'core';

export interface IReferenceSchema {
    'identifier': Identifier,
    'creation': number,
    'repository': Identifier,
    'data': Identifier,
    'fingerprint': Fingerprint,
    'record'?: Identifier
}