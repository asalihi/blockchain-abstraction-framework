import { Identifier, Fingerprint } from '@core/types/types';

export type StoredReference = { 'identifier': Identifier, 'creation': number, 'data': Identifier, 'fingerprint': Fingerprint, 'repository': Identifier, 'record'?: Identifier };