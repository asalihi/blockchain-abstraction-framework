import { Identifier, HTTPEndpoint } from '@service/utils/types';

export interface IModuleSchema {
    'identifier': Identifier,
    'name': string,
    'description'?: string,
    'server': HTTPEndpoint
}