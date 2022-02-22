import { Identifier, HTTPEndpoint } from '@service/utils/types';

export type Module = { 'identifier': Identifier, 'name': string, 'description'?: string, 'server': HTTPEndpoint };