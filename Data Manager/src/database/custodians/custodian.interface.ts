import { OpenAPIV3 } from 'openapi-types';

import { Identifier, CustodianType, CustodianConfiguration } from 'core';

export interface ICustodianSchema {
    'identifier': Identifier,
    'type': CustodianType,
    'registration': number,
    'server': string,
    'configuration'?: CustodianConfiguration
}