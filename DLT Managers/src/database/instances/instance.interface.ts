import { GenericObject, DLTNetwork, DLTInstanceState, DLTInstanceProfile } from 'core';
import { IDLTInstanceProfileModel } from '@service/database/schemata';

// TODO: Create specific configuration for each network and use discriminators (> see created model for Hyperledger Fabric)
export interface IDLTInstanceSchema {
    'identifier': string,
    'network': DLTNetwork,
    'creation': Date,
    'desactivation'?: Date,
    'state': DLTInstanceState,
    'configuration': GenericObject,
    'profile': string | IDLTInstanceProfileModel | DLTInstanceProfile
}