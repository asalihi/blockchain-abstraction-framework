import { Identifier, RepositoryState } from 'core';

export interface IRepositorySchema {
    'identifier': Identifier,
    'name': string,
    'description'?: string,
    'creation': number,
    'custodian': Identifier,
    'state': RepositoryState,
    'entries': Identifier[]
}