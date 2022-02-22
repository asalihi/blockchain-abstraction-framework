import { FabricNetworkConfiguration } from 'core';
import { IDLTInstanceSchema } from '../../instance.interface';

export interface IFabricNetworkSchema extends IDLTInstanceSchema {
    network: 'fabric',
    configuration: FabricNetworkConfiguration
}