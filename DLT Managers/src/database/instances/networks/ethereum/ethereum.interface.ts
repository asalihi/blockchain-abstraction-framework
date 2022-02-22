import { GenericObject } from 'core';
import { IDLTInstanceSchema } from '../../instance.interface';

export interface IEthereumNetworkSchema extends IDLTInstanceSchema {
    network: 'ethereum',
    configuration: GenericObject // TODO: Create dedicated configuration type for Ethereum
}