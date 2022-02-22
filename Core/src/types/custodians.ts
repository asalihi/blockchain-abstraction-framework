import { OpenAPIV3 } from 'openapi-types';

import { Identifier } from './core';

export const CustodianTypeValues = ['internal', 'external', 'decentralized'];
export type CustodianType = typeof CustodianTypeValues[number];
export type CustodianConfiguration = { [key: string]: any };
export type Custodian = { 'identifier': Identifier, 'type': CustodianType, 'registration': number, 'server': OpenAPIV3.Document, 'configuration'?: CustodianConfiguration };